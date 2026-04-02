# CodeLens AI — Code Explainer

Paste C, Python, or JavaScript code and get an instant plain-English breakdown — powered by AI, completely free.

**[→ Try it live]([https://your-project.vercel.app](https://ai-code-explainer-admz.vercel.app/))** *(replace with your actual Vercel URL after deploying)*

---

## What It Does

Drop in a code snippet and get four things back in seconds:

- **Summary** — A 2–3 sentence explanation of what the code does
- **Line-by-line breakdown** — Every line explained in plain English
- **Key concepts** — Programming concepts used (e.g., recursion, closures, pointer arithmetic)
- **Suggested improvements** — Actionable code quality suggestions with reasoning

## Why I Built It

I wanted a portfolio project that demonstrates real AI integration, not just a static UI. This app hits a live LLM, handles structured prompting, rate limiting, error states, and deploys on a zero-cost infrastructure stack.

## Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | React 18 + Vite | Free |
| AI Model | Gemini 2.5 Flash (Google AI Studio) | Free tier — no billing required |
| Backend | Vercel Serverless Function (single route) | Free (Hobby plan) |
| Hosting | Vercel | Free |
| **Total** | | **$0/month** |

## Architecture

```
Browser → POST /api/analyze → Vercel Serverless Function → Gemini 2.5 Flash
                                    ↓
                          Validate input (language, length)
                          Check rate limits (global + per-IP)
                          Call Gemini with structured prompt
                          Parse JSON response
                          Return to client
```

The API key never reaches the browser. Rate limiting runs in-memory inside the serverless function, checked *before* any call to Gemini. If limits are hit, the request is rejected immediately and the AI is never called.

### Rate Limits (abuse prevention)

- **100 requests/day** global cap (Gemini free tier allows 1,500 — this leaves a wide safety margin)
- **2 requests/minute** per IP address
- **3,000 character** max input length
- All limits enforced server-side before the Gemini call

### Error Handling

Every failure has a specific, user-friendly UI state:

- **Rate limit** → countdown timer, auto-re-enables when ready
- **Daily quota reached** → clear message with reset time
- **AI service busy** → retry with backoff
- **Malformed AI response** → retry prompt (usually works on second attempt)
- **Network failure** → connection check message + retry

## Run It Locally

You need Node.js 18+ and a free Gemini API key.

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/ai-code-explainer.git
cd ai-code-explainer

# 2. Install dependencies
npm install

# 3. Add your API key
cp .env.example .env.local
# Open .env.local and paste your key from https://aistudio.google.com/apikey

# 4. Start the dev server
npx vercel dev
```

Open [http://localhost:3000](http://localhost:3000) and paste some code.

> **Important:** Do NOT enable billing on your Google Cloud project. The free tier gives you 1,500 requests/day. If you exceed it, Google simply rejects requests — it won't charge you.

## Deploy Your Own

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select the repo
3. Add `GEMINI_API_KEY` as an environment variable in Vercel's dashboard
4. Click Deploy

Vercel auto-detects Vite, builds, and gives you a live URL in about 60 seconds.

## Project Structure

```
ai-code-explainer/
├── api/
│   └── analyze.js           # Serverless function (validation, rate limiting, Gemini call)
├── src/
│   ├── components/
│   │   └── CodeExplainer.jsx # Full UI (input, results, all states)
│   ├── App.jsx               # Root component
│   └── main.jsx              # React entry point
├── public/
│   └── favicon.svg
├── index.html
├── vercel.json               # API rewrites
├── vite.config.js
└── package.json
```

## Supported Languages

- 🐍 Python
- ⚡ JavaScript
- ⚙️ C

## License

MIT
