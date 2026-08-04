# Luna — AI Adult Companion Telegram Bot 🔥

A seductive, uninhibited AI companion Telegram bot. Powered by **Groq** (100% free, no credit card needed). Flirty conversation, dirty talk, and immersive role-play.

## ✅ Required: Get Your FREE Groq API Key

1. Go to **[console.groq.com](https://console.groq.com)**
2. Sign up (free, no credit card)
3. Go to **API Keys** → **Create API Key**
4. Copy the key — you'll add it to Railway as `GROQ_API_KEY`

Groq runs **Llama 3.3 70B** — fast, free, and less restricted than OpenAI.

---

## 🚀 Deploy to Railway (runs 24/7, free)

### Step 1 — Connect repo

1. Go to **[railway.app](https://railway.app)** → New Project
2. Click **Deploy from GitHub repo** → pick `luna-telegram-ai-bot`

### Step 2 — Set environment variables

In Railway → your project → **Variables** tab, add:

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `GROQ_API_KEY` | `gsk_...` | [console.groq.com](https://console.groq.com) → API Keys |
| `TELEGRAM_BOT_TOKEN` | `12345:ABC...` | [@BotFather](https://t.me/BotFather) on Telegram |

> ⚠️ Do NOT add `PORT` — Railway sets it automatically.

### Step 3 — Deploy

Railway auto-builds and starts. Luna is live in ~2 minutes. No Replit, no other service needed.

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | Show all commands |
| `/roleplay [scenario]` | Start a custom role-play scene |
| `/reset` | Clear conversation history |

---

## Local Setup

```bash
git clone https://github.com/Agrim777/luna-telegram-ai-bot.git
cd luna-telegram-ai-bot
pnpm install

export GROQ_API_KEY=gsk_your_key_here
export TELEGRAM_BOT_TOKEN=your_bot_token_here
export PORT=5000

pnpm --filter @workspace/api-server run dev
```

---

## Tech Stack

- **Bot:** [Telegraf](https://telegraf.js.org/) — Telegram Bot API
- **AI:** [Groq](https://groq.com/) — free Llama 3.3 70B inference
- **Server:** Express 5 (health endpoint)
- **Runtime:** Node.js 22, TypeScript 5.9
- **Deploy:** Railway (Nixpacks, pnpm monorepo)

## Project Structure

```
artifacts/api-server/src/
  telegram/
    bot.ts           # Telegraf handlers
    personas.ts      # Luna's personality & system prompts
    conversations.ts # In-memory chat history (per user)
  app.ts             # Express app
  index.ts           # Entry: starts server + bot

railway.json         # Railway deploy config
nixpacks.toml        # Build phases
```
