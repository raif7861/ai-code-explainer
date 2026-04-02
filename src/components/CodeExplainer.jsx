import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────
const T = {
  bg: "#08080C",
  surface: "#111118",
  surfaceRaised: "#181820",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  accent: "#E8A84C",
  accentGlow: "rgba(232,168,76,0.15)",
  accentMuted: "rgba(232,168,76,0.08)",
  textPrimary: "#E8E8ED",
  textSecondary: "#8B8B9E",
  textTertiary: "#56566A",
  success: "#4ADE80",
  info: "#60A5FA",
  warning: "#FBBF24",
  danger: "#F87171",
  radius: "10px",
  radiusLg: "14px",
  font: "'Manrope', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

const LANGUAGES = [
  { value: "python", label: "Python", icon: "🐍" },
  { value: "javascript", label: "JavaScript", icon: "⚡" },
  { value: "c", label: "C", icon: "⚙️" },
];

const MAX_LENGTH = 3000;

const LOADING_MESSAGES = [
  "Reading your code…",
  "Mapping the logic…",
  "Identifying patterns…",
  "Tracing execution flow…",
  "Extracting concepts…",
  "Drafting explanations…",
  "Polishing the summary…",
];

const SAMPLE_CODE = {
  python: `def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

print(fibonacci(10))`,
  javascript: `function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

const log = debounce(console.log, 300);`,
  c: `#include <stdio.h>

int binary_search(int arr[], int size, int target) {
    int low = 0, high = size - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
};

// ─────────────────────────────────────────────
// Styles (CSS-in-JS object)
// ─────────────────────────────────────────────
const S = {
  global: `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: ${T.bg};
      color: ${T.textPrimary};
      font-family: ${T.font};
      -webkit-font-smoothing: antialiased;
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${T.borderHover}; }

    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
};

// ─────────────────────────────────────────────
// Icons (inline SVGs)
// ─────────────────────────────────────────────
const Icons = {
  Sparkle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  ),
  Copy: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Code: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
};

// ─────────────────────────────────────────────
// Utility Components
// ─────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      style={{
        background: copied ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : T.border}`,
        borderRadius: "6px",
        padding: "5px 8px",
        cursor: "pointer",
        color: copied ? T.success : T.textSecondary,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "12px",
        fontFamily: T.font,
        transition: "all 0.2s ease",
      }}
    >
      {copied ? <Icons.Check /> : <Icons.Copy />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ShimmerBlock({ width = "100%", height = "16px", radius = "6px", style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${T.surfaceRaised} 25%, rgba(255,255,255,0.04) 50%, ${T.surfaceRaised} 75%)`,
        backgroundSize: "800px 100%",
        animation: "shimmer 1.8s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function AccentBar({ color }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: "16px",
        bottom: "16px",
        width: "3px",
        borderRadius: "0 3px 3px 0",
        background: color,
        opacity: 0.7,
      }}
    />
  );
}

// ─────────────────────────────────────────────
// Card Wrapper
// ─────────────────────────────────────────────
function Card({ children, accent, delay = 0, style = {} }) {
  return (
    <div
      style={{
        position: "relative",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusLg,
        padding: "24px 24px 24px 20px",
        animation: `fadeUp 0.45s ease-out ${delay}ms both`,
        overflow: "hidden",
        ...style,
      }}
    >
      {accent && <AccentBar color={accent} />}
      <div style={{ paddingLeft: accent ? "12px" : 0 }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────
function EmptyState({ onLoadSample, language }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: "400px",
        textAlign: "center",
        padding: "40px 24px",
        animation: "fadeUp 0.5s ease-out",
      }}
    >
      <div
        style={{
          width: "88px",
          height: "88px",
          borderRadius: "20px",
          background: T.accentMuted,
          border: `1px solid rgba(232,168,76,0.12)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.accent,
          marginBottom: "24px",
        }}
      >
        <Icons.Code />
      </div>
      <h2
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: T.textPrimary,
          marginBottom: "10px",
          letterSpacing: "-0.02em",
        }}
      >
        Paste code to explore
      </h2>
      <p
        style={{
          fontSize: "14px",
          color: T.textSecondary,
          lineHeight: 1.6,
          maxWidth: "320px",
          marginBottom: "28px",
        }}
      >
        Drop in any C, Python, or JavaScript snippet and get a plain-English breakdown with concepts and suggestions.
      </p>
      <button
        onClick={onLoadSample}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${T.border}`,
          borderRadius: "8px",
          padding: "10px 20px",
          color: T.textSecondary,
          fontSize: "13px",
          fontFamily: T.font,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "rgba(255,255,255,0.06)";
          e.target.style.color = T.textPrimary;
          e.target.style.borderColor = T.borderHover;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "rgba(255,255,255,0.04)";
          e.target.style.color = T.textSecondary;
          e.target.style.borderColor = T.border;
        }}
      >
        Load a {LANGUAGES.find((l) => l.value === language)?.label} sample
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Loading State
// ─────────────────────────────────────────────
function LoadingState() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
      {/* Status message */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 18px",
          background: T.accentMuted,
          border: `1px solid rgba(232,168,76,0.1)`,
          borderRadius: T.radius,
          animation: "fadeUp 0.3s ease-out",
        }}
      >
        <div
          style={{
            width: "18px",
            height: "18px",
            border: `2px solid ${T.accent}`,
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "13px", color: T.accent, fontWeight: 500, fontFamily: T.font }}>
          {LOADING_MESSAGES[msgIdx]}
        </span>
      </div>

      {/* Skeleton cards */}
      {[T.accent, T.info, T.success, T.danger].map((color, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg,
            padding: "24px 24px 24px 32px",
            animation: `fadeUp 0.4s ease-out ${100 + i * 80}ms both`,
          }}
        >
          <AccentBar color={color} />
          <ShimmerBlock width="120px" height="14px" style={{ marginBottom: "16px" }} />
          <ShimmerBlock width="100%" height="12px" style={{ marginBottom: "10px" }} />
          <ShimmerBlock width="85%" height="12px" style={{ marginBottom: "10px" }} />
          <ShimmerBlock width="60%" height="12px" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Error State
// ─────────────────────────────────────────────
function ErrorState({ error, onRetry }) {
  const isRateLimit = error?.type === "rate_limit" || error?.type === "daily_limit" || error?.type === "provider_limit";
  const retryAfter = error?.retryAfter;
  const [countdown, setCountdown] = useState(retryAfter || 0);

  useEffect(() => {
    if (!retryAfter) return;
    setCountdown(retryAfter);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(iv);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [retryAfter]);

  const formatTime = (s) => {
    if (s > 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
    if (s > 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${s}s`;
  };

  const titles = {
    rate_limit: "Slow down a bit",
    daily_limit: "Daily quota reached",
    provider_limit: "AI service busy",
    parse_error: "Response error",
    network_error: "Connection failed",
    validation_error: "Invalid input",
  };

  const canRetry = error?.type !== "daily_limit" && (countdown === 0 || !isRateLimit);

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out" }}>
      <Card accent={isRateLimit ? T.warning : T.danger}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: isRateLimit ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isRateLimit ? T.warning : T.danger,
              flexShrink: 0,
            }}
          >
            {isRateLimit ? <Icons.Clock /> : <Icons.AlertCircle />}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px", color: T.textPrimary }}>
              {titles[error?.type] || "Something went wrong"}
            </h3>
            <p style={{ fontSize: "13px", color: T.textSecondary, lineHeight: 1.6, marginBottom: "16px" }}>
              {error?.message || "An unexpected error occurred. Please try again."}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {canRetry && (
                <button
                  onClick={onRetry}
                  style={{
                    background: T.accent,
                    border: "none",
                    borderRadius: "7px",
                    padding: "8px 18px",
                    color: "#0A0A0F",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: T.font,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.target.style.opacity = "1")}
                >
                  Try again
                </button>
              )}
              {countdown > 0 && (
                <span style={{ fontSize: "12px", color: T.textTertiary, display: "flex", alignItems: "center", gap: "5px" }}>
                  <Icons.Clock /> Retry in {formatTime(countdown)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// Result: Summary Card
// ─────────────────────────────────────────────
function SummaryCard({ summary }) {
  return (
    <Card accent={T.accent} delay={0}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textSecondary }}>
          Summary
        </h3>
        <CopyButton text={summary} />
      </div>
      <p style={{ fontSize: "14px", lineHeight: 1.75, color: T.textPrimary }}>{summary}</p>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Result: Line-by-Line Card
// ─────────────────────────────────────────────
function LineByLineCard({ lines }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <Card accent={T.info} delay={80}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginBottom: expanded ? "16px" : 0,
        }}
      >
        <h3 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textSecondary }}>
          Line by Line <span style={{ fontWeight: 400, opacity: 0.6, textTransform: "none", letterSpacing: 0 }}>({lines.length} lines)</span>
        </h3>
        <span
          style={{
            color: T.textTertiary,
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s ease",
            display: "flex",
          }}
        >
          <Icons.ChevronDown />
        </span>
      </button>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "480px", overflowY: "auto" }}>
          {lines.map((item, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr 1fr",
                gap: "12px",
                padding: "8px 8px",
                borderRadius: "6px",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                alignItems: "start",
              }}
            >
              <span style={{ fontSize: "11px", fontFamily: T.mono, color: T.textTertiary, textAlign: "right", paddingTop: "2px" }}>
                {i + 1}
              </span>
              <code
                style={{
                  fontSize: "12.5px",
                  fontFamily: T.mono,
                  color: "#C4B5FD",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  lineHeight: 1.6,
                }}
              >
                {item.line}
              </code>
              <span style={{ fontSize: "12.5px", color: T.textSecondary, lineHeight: 1.6 }}>{item.explanation}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────
// Result: Key Concepts Card
// ─────────────────────────────────────────────
function ConceptsCard({ concepts }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Card accent={T.success} delay={160}>
      <h3 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textSecondary, marginBottom: "14px" }}>
        Key Concepts
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {concepts.map((c, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column" }}>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                background: openIdx === i ? "rgba(74,222,128,0.12)" : "rgba(74,222,128,0.06)",
                border: `1px solid ${openIdx === i ? "rgba(74,222,128,0.3)" : "rgba(74,222,128,0.12)"}`,
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontFamily: T.font,
                fontWeight: 500,
                color: openIdx === i ? T.success : "rgba(74,222,128,0.8)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {c.name}
            </button>
            {openIdx === i && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "10px 14px",
                  background: "rgba(74,222,128,0.04)",
                  border: `1px solid rgba(74,222,128,0.1)`,
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  color: T.textSecondary,
                  lineHeight: 1.6,
                  animation: "fadeUp 0.2s ease-out",
                  maxWidth: "340px",
                }}
              >
                {c.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Result: Improvements Card
// ─────────────────────────────────────────────
function ImprovementsCard({ improvements }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Card accent={T.danger} delay={240}>
      <h3 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.textSecondary, marginBottom: "14px" }}>
        Suggested Improvements
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {improvements.map((item, i) => (
          <div
            key={i}
            style={{
              background: "rgba(248,113,113,0.03)",
              border: `1px solid ${openIdx === i ? "rgba(248,113,113,0.15)" : T.border}`,
              borderRadius: "8px",
              overflow: "hidden",
              transition: "border-color 0.2s ease",
            }}
          >
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "none",
                border: "none",
                padding: "12px 14px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 500, color: T.textPrimary, lineHeight: 1.5 }}>
                {item.suggestion}
              </span>
              <span
                style={{
                  color: T.textTertiary,
                  transform: openIdx === i ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s ease",
                  display: "flex",
                  flexShrink: 0,
                  marginLeft: "10px",
                }}
              >
                <Icons.ChevronDown />
              </span>
            </button>
            {openIdx === i && (
              <div
                style={{
                  padding: "0 14px 14px",
                  fontSize: "12.5px",
                  color: T.textSecondary,
                  lineHeight: 1.65,
                  animation: "fadeUp 0.2s ease-out",
                }}
              >
                {item.reasoning}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────
export default function CodeExplainer() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [state, setState] = useState("empty"); // empty | loading | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const resultsPanelRef = useRef(null);

  const charCount = code.length;
  const overLimit = charCount > MAX_LENGTH;

  const analyze = useCallback(async () => {
    if (!code.trim() || overLimit) return;

    setState("loading");
    setError(null);
    setResult(null);

    // Scroll results panel to top
    if (resultsPanelRef.current) {
      resultsPanelRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), language }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError({
          type: data.error || "network_error",
          message: data.message || "Something went wrong.",
          retryAfter: data.retryAfter || null,
        });
        setState("error");
        return;
      }

      if (data.success && data.data) {
        setResult(data.data);
        setState("success");
      } else {
        setError({ type: "parse_error", message: "Unexpected response format." });
        setState("error");
      }
    } catch (err) {
      setError({
        type: "network_error",
        message: "Could not reach the server. Check your connection and try again.",
      });
      setState("error");
    }
  }, [code, language, overLimit]);

  const handleClear = () => {
    setCode("");
    setState("empty");
    setResult(null);
    setError(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleLoadSample = () => {
    setCode(SAMPLE_CODE[language] || SAMPLE_CODE.python);
    setState("empty");
    setResult(null);
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      analyze();
    }
  };

  return (
    <>
      <style>{S.global}</style>
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ───── Header ───── */}
        <header
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(8,8,12,0.8)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: `linear-gradient(135deg, ${T.accent}, #D97706)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "14px" }}>⟨⟩</span>
            </div>
            <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em", color: T.textPrimary }}>
              CodeLens
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "4px",
                background: T.accentMuted,
                color: T.accent,
                letterSpacing: "0.04em",
              }}
            >
              AI
            </span>
          </div>
          <span style={{ fontSize: "12px", color: T.textTertiary }}>Gemini 2.5 Flash</span>
        </header>

        {/* ───── Main Layout ───── */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            maxWidth: "1400px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {/* ───── Left: Input Panel ───── */}
          <div
            style={{
              padding: "24px",
              borderRight: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              height: "calc(100vh - 61px)",
              position: "sticky",
              top: "61px",
              overflowY: "auto",
            }}
          >
            {/* Language Selector */}
            <div style={{ display: "flex", gap: "6px" }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${language === lang.value ? "rgba(232,168,76,0.3)" : T.border}`,
                    background: language === lang.value ? T.accentMuted : "transparent",
                    color: language === lang.value ? T.accent : T.textSecondary,
                    fontSize: "13px",
                    fontFamily: T.font,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <span>{lang.icon}</span>
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Code Textarea */}
            <div
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                borderRadius: T.radiusLg,
                border: `1px solid ${overLimit ? "rgba(248,113,113,0.4)" : T.border}`,
                background: T.surface,
                overflow: "hidden",
                transition: "border-color 0.2s ease",
              }}
            >
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste your code here…"
                spellCheck={false}
                style={{
                  flex: 1,
                  resize: "none",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: T.textPrimary,
                  fontFamily: T.mono,
                  fontSize: "13px",
                  lineHeight: 1.7,
                  padding: "18px",
                  width: "100%",
                  tabSize: 4,
                }}
              />
              {/* Character counter */}
              <div
                style={{
                  padding: "8px 18px",
                  borderTop: `1px solid ${T.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "11px", color: T.textTertiary }}>
                  {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}+Enter to analyze
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: T.mono,
                    color: overLimit ? T.danger : charCount > MAX_LENGTH * 0.9 ? T.warning : T.textTertiary,
                    transition: "color 0.2s ease",
                  }}
                >
                  {charCount.toLocaleString()}/{MAX_LENGTH.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={analyze}
                disabled={!code.trim() || overLimit || state === "loading"}
                style={{
                  flex: 1,
                  padding: "13px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    !code.trim() || overLimit || state === "loading"
                      ? T.surfaceRaised
                      : `linear-gradient(135deg, ${T.accent}, #D97706)`,
                  color: !code.trim() || overLimit || state === "loading" ? T.textTertiary : "#0A0A0F",
                  fontSize: "14px",
                  fontFamily: T.font,
                  fontWeight: 700,
                  cursor: !code.trim() || overLimit || state === "loading" ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow:
                    code.trim() && !overLimit && state !== "loading"
                      ? `0 4px 20px ${T.accentGlow}`
                      : "none",
                }}
              >
                {state === "loading" ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(10,10,15,0.3)",
                        borderTopColor: "#0A0A0F",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Icons.Sparkle />
                    Analyze Code
                  </>
                )}
              </button>
              {code && (
                <button
                  onClick={handleClear}
                  title="Clear"
                  style={{
                    padding: "13px 16px",
                    borderRadius: "10px",
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.textTertiary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)";
                    e.currentTarget.style.color = T.danger;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.color = T.textTertiary;
                  }}
                >
                  <Icons.Trash />
                </button>
              )}
            </div>
          </div>

          {/* ───── Right: Results Panel ───── */}
          <div
            ref={resultsPanelRef}
            style={{
              padding: "24px",
              height: "calc(100vh - 61px)",
              overflowY: "auto",
            }}
          >
            {state === "empty" && <EmptyState onLoadSample={handleLoadSample} language={language} />}
            {state === "loading" && <LoadingState />}
            {state === "error" && <ErrorState error={error} onRetry={analyze} />}
            {state === "success" && result && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <SummaryCard summary={result.summary} />
                <LineByLineCard lines={result.lineByLine} />
                <ConceptsCard concepts={result.keyConcepts} />
                <ImprovementsCard improvements={result.improvements} />
              </div>
            )}
          </div>
        </div>

        {/* ───── Responsive: stack on mobile ───── */}
        <style>{`
          @media (max-width: 800px) {
            div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
            div[style*="position: sticky"][style*="height: calc"] {
              position: static !important;
              height: auto !important;
              min-height: 400px;
              border-right: none !important;
              border-bottom: 1px solid ${T.border};
            }
          }
        `}</style>
      </div>
    </>
  );
}