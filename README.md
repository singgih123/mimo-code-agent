# 🤖 CodeReview AI Agent

> AI-powered code review agent using MiMo v2.5 Pro for deep multi-pass analysis of pull requests.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/singgih123/mimo-code-agent)

## Overview

CodeReview AI Agent automatically reviews every pull request using Xiaomi's MiMo v2.5 Pro model. It performs **4 specialized analysis passes** on each file, catching security vulnerabilities, performance issues, bugs, and best practice violations before they reach production.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   GitHub    │────▶│   Webhook    │────▶│  Review Engine  │────▶│   GitHub     │
│  PR Event   │     │   Handler    │     │  (Multi-Pass)   │     │  Comments    │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────────────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    ▼             ▼             ▼
                              ┌──────────┐ ┌──────────┐ ┌──────────┐
                              │ Security │ │  Perf    │ │  Bugs    │
                              │  Pass    │ │  Pass    │ │  Pass    │
                              └──────────┘ └──────────┘ └──────────┘
                                    │             │             │
                                    └─────────────┼─────────────┘
                                                  ▼
                                         ┌──────────────┐
                                         │  MiMo API    │
                                         │  v2.5 Pro    │
                                         └──────────────┘
```

## Features

- **🔒 Security Analysis** — Injection attacks, auth bypasses, data exposure, OWASP Top 10
- **⚡ Performance Review** — O(n²) detection, memory leaks, N+1 queries, bundle optimization
- **📋 Best Practices** — SOLID principles, error handling, type safety, accessibility
- **🐛 Bug Detection** — Logic errors, null risks, race conditions, edge cases
- **📝 Executive Summary** — Health score, blocking issues, actionable recommendations
- **🎯 Smart Triage** — Pre-scan to prioritize files needing deep review

## MiMo Model Usage

| Model | Purpose | Tokens/Request |
|-------|---------|---------------|
| `mimo-v2.5-pro` | Deep multi-pass analysis (security, perf, bugs, best practices) | ~100K |
| `mimo-v2.5` | Quick triage, summary generation | ~10K |

## Token Consumption Estimate

At production scale, this agent consumes approximately **150M tokens per day**:

```
Daily Token Calculation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 50 PRs/day × 8 files avg = 400 file reviews/day
• Each file gets 4 deep analysis passes (security, perf, best practices, bugs)
• 400 files × 4 passes = 1,600 API calls/day
• Each pass: ~50K prompt tokens + ~50K completion tokens = ~100K tokens
• Deep analysis total: 1,600 × 100K = 160M tokens
• Summary generation: 50 PRs × 20K tokens = 1M tokens
• Quick triage scans: 400 files × 5K tokens = 2M tokens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~150M tokens/day at scale
```

## Getting Started

### Prerequisites

- Node.js 18+
- GitHub account with a personal access token
- MiMo API key (from [MiMo Orbit Program](https://xiaomimimo.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/singgih123/mimo-code-agent.git
cd mimo-code-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MIMO_API_KEY` | Your MiMo API key |
| `MIMO_BASE_URL` | MiMo API endpoint (`https://token-plan-sgp.xiaomimimo.com/v1`) |
| `GITHUB_TOKEN` | GitHub personal access token with `repo` scope |
| `WEBHOOK_SECRET` | Secret for verifying GitHub webhook signatures |

### Deploy to Vercel

1. Push this repo to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Configure GitHub webhook to point to `https://your-app.vercel.app/api/webhook`

### Configure GitHub Webhook

1. Go to your repository → Settings → Webhooks → Add webhook
2. **Payload URL**: `https://your-app.vercel.app/api/webhook`
3. **Content type**: `application/json`
4. **Secret**: Same as your `WEBHOOK_SECRET`
5. **Events**: Select "Pull requests"

## API Endpoints

### `POST /api/webhook`
GitHub webhook receiver. Automatically triggered on PR events.

### `POST /api/review`
Manual review trigger. Send a JSON body:

```json
{
  "owner": "singgih123",
  "repo": "mimo-code-agent",
  "prNumber": 1,
  "passes": ["security", "performance", "best-practices", "bugs"]
}
```

### `GET /api/webhook`
Health check endpoint. Returns service status and capabilities.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI Model**: MiMo v2.5 Pro (OpenAI-compatible API)
- **GitHub Integration**: Octokit REST
- **Deployment**: Vercel (Serverless Functions)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── webhook/route.ts    # GitHub webhook handler
│   │   └── review/route.ts     # Manual review trigger
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Dashboard
├── components/
│   └── Dashboard.tsx           # Metrics dashboard
└── lib/
    ├── mimo-client.ts          # MiMo API client
    ├── reviewer.ts             # Multi-pass review engine
    ├── github.ts               # GitHub integration
    ├── prompts.ts              # System prompts
    └── types.ts                # TypeScript interfaces
```

## License

MIT

---

Built with ❤️ using [MiMo](https://xiaomimimo.com) AI models.
