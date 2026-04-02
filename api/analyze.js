// ============================================================
// /api/analyze.js — Vercel Serverless Function
// AI Code Explainer — Gemini 2.0 Flash (Free Tier Only)
// ============================================================

// --------------- Rate Limiting (in-memory) ------------------
// These reset on cold starts. That's intentional — it means
// limits are conservative (the safe direction for cost control).

const GLOBAL_DAILY_CAP = 100;
const PER_IP_PER_MINUTE = 2;
const MAX_CODE_LENGTH = 3000;
const VALID_LANGUAGES = ["c", "python", "javascript"];

let globalCounter = { count: 0, date: "" };
const ipMap = new Map(); // Map<string, Array<number>> — timestamps

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getSecondsUntilMidnightUTC() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  return Math.ceil((midnight - now) / 1000);
}

function checkGlobalLimit() {
  const today = getTodayUTC();
  if (globalCounter.date !== today) {
    globalCounter = { count: 0, date: today };
  }
  if (globalCounter.count >= GLOBAL_DAILY_CAP) {
    return {
      allowed: false,
      retryAfter: getSecondsUntilMidnightUTC(),
    };
  }
  return { allowed: true };
}

function incrementGlobalCounter() {
  const today = getTodayUTC();
  if (globalCounter.date !== today) {
    globalCounter = { count: 0, date: today };
  }
  globalCounter.count++;
}

function checkIpLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  if (!ipMap.has(ip)) {
    ipMap.set(ip, []);
  }

  // Purge timestamps older than the window
  const timestamps = ipMap.get(ip).filter((t) => now - t < windowMs);
  ipMap.set(ip, timestamps);

  if (timestamps.length >= PER_IP_PER_MINUTE) {
    const oldestInWindow = timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

function recordIpRequest(ip) {
  if (!ipMap.has(ip)) {
    ipMap.set(ip, []);
  }
  ipMap.get(ip).push(Date.now());
}

// Prevent the ipMap from growing forever.
// Runs at most once per minute — purges stale IPs.
let lastPurge = Date.now();
function purgeStaleIps() {
  const now = Date.now();
  if (now - lastPurge < 60_000) return;
  lastPurge = now;
  const windowMs = 60_000;
  for (const [ip, timestamps] of ipMap) {
    const fresh = timestamps.filter((t) => now - t < windowMs);
    if (fresh.length === 0) {
      ipMap.delete(ip);
    } else {
      ipMap.set(ip, fresh);
    }
  }
}

// --------------- Gemini API Call ----------------------------

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildPrompt(code, language) {
  return `You are a code teaching assistant. Analyze the following ${language} code.

Respond with ONLY a valid JSON object. No markdown fences, no backticks, no explanation outside the JSON.

The JSON must have these exact keys:
- "summary": A 2-3 sentence plain English explanation of what the code does overall.
- "lineByLine": An array where each element is {"line": "<original code line>", "explanation": "<what this line does>"}. Include every non-empty line. For blank lines or comments, still include them with a brief note.
- "keyConcepts": An array where each element is {"name": "<concept name>", "description": "<1-2 sentence explanation of the concept>"}. Include 3-6 key programming concepts used in this code.
- "improvements": An array where each element is {"suggestion": "<what to improve>", "reasoning": "<why this matters>"}. Include 2-5 actionable suggestions.

Here is the code:

\`\`\`${language}
${code}
\`\`\``;
}

async function callGemini(code, language) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000); // 25s timeout

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(code, language) }],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Low temp for consistent structured output
          maxOutputTokens: 4096,
        },
      }),
    });

    clearTimeout(timeout);

    // Gemini free-tier rate limit hit
    if (res.status === 429) {
      return { error: "provider_limit" };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Gemini API error ${res.status}: ${body}`);
      return { error: "network_error", detail: `Gemini returned ${res.status}` };
    }

    const data = await res.json();

    // Extract the text from Gemini's response structure
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Gemini returned empty content:", JSON.stringify(data));
      return { error: "parse_error", detail: "Empty response from model" };
    }

    return { text };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { error: "network_error", detail: "Request timed out (25s)" };
    }
    console.error("Gemini fetch failed:", err.message);
    return { error: "network_error", detail: err.message };
  }
}

function parseGeminiResponse(text) {
  // Strip markdown fences if the model wraps its output
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validate shape — every required key must exist and be the right type
    if (typeof parsed.summary !== "string") return null;
    if (!Array.isArray(parsed.lineByLine)) return null;
    if (!Array.isArray(parsed.keyConcepts)) return null;
    if (!Array.isArray(parsed.improvements)) return null;

    return {
      summary: parsed.summary,
      lineByLine: parsed.lineByLine,
      keyConcepts: parsed.keyConcepts,
      improvements: parsed.improvements,
    };
  } catch {
    return null;
  }
}

// --------------- Request Handler ----------------------------

export default async function handler(req, res) {
  // CORS headers for local dev and production
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "method_not_allowed",
      message: "Only POST requests are accepted.",
    });
  }

  // --- Validate input ---
  const { code, language } = req.body || {};

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({
      error: "validation_error",
      message: "Code is required and cannot be empty.",
    });
  }

  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({
      error: "validation_error",
      message: `Code must be ${MAX_CODE_LENGTH} characters or fewer. You sent ${code.length}.`,
    });
  }

  if (!VALID_LANGUAGES.includes(language)) {
    return res.status(400).json({
      error: "validation_error",
      message: `Language must be one of: ${VALID_LANGUAGES.join(", ")}. Got "${language}".`,
    });
  }

  // --- Rate limiting (checked BEFORE calling Gemini) ---
  purgeStaleIps();

  const globalCheck = checkGlobalLimit();
  if (!globalCheck.allowed) {
    return res.status(429).json({
      error: "daily_limit",
      message: "Today's free analysis quota has been reached. Resets at midnight UTC.",
      retryAfter: globalCheck.retryAfter,
    });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const ipCheck = checkIpLimit(ip);
  if (!ipCheck.allowed) {
    return res.status(429).json({
      error: "rate_limit",
      message: "Too many requests. Please wait a moment before trying again.",
      retryAfter: ipCheck.retryAfter,
    });
  }

  // --- Call Gemini ---
  // Record the request BEFORE calling so that concurrent requests
  // from the same IP are counted even if Gemini is slow.
  recordIpRequest(ip);
  incrementGlobalCounter();

  const geminiResult = await callGemini(code, language);

  if (geminiResult.error === "provider_limit") {
    return res.status(429).json({
      error: "provider_limit",
      message: "The AI service is temporarily busy. Try again in about 30 seconds.",
      retryAfter: 30,
    });
  }

  if (geminiResult.error === "network_error") {
    return res.status(502).json({
      error: "network_error",
      message: "Could not reach the AI service. Please try again shortly.",
      detail: geminiResult.detail,
    });
  }

  if (geminiResult.error === "parse_error") {
    return res.status(502).json({
      error: "parse_error",
      message: "The AI returned an unexpected response. Try again.",
      detail: geminiResult.detail,
    });
  }

  // --- Parse structured JSON from Gemini's text ---
  const parsed = parseGeminiResponse(geminiResult.text);

  if (!parsed) {
    console.error("Failed to parse Gemini output:", geminiResult.text.slice(0, 500));
    return res.status(502).json({
      error: "parse_error",
      message: "The AI returned a malformed response. Usually works on retry.",
    });
  }

  // --- Success ---
  return res.status(200).json({
    success: true,
    data: parsed,
  });
}