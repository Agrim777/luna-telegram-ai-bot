# Luna — AI Adult Companion Telegram Bot 🔥

A seductive, uninhibited AI companion Telegram bot powered by OpenAI GPT-4o. Engages in flirty conversation, explicit dirty talk, and immersive role-play scenarios.

## Features

- 💋 **Seductive personality** — Luna is confident, provocative, and fully uninhibited
- 🎭 **Role-play mode** — any scenario, any character, fully committed
- 🔥 **Explicit dirty talk** — no limits, no disclaimers, no breaking character
- 🧠 **Conversation memory** — remembers context (up to 30 messages per session)
- 🔄 **Reset anytime** — `/reset` for a fresh start
- ☁️ **Railway ready** — deploy in under 2 minutes, runs 24/7 without Replit

## Deploy to Railway (Free, runs independently)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Step-by-step

1. **Fork or clone this repo** to your GitHub account

2. **Go to [railway.app](https://railway.app)** → New Project → Deploy from GitHub repo → select this repo

3. **Set environment variables** in Railway dashboard (Variables tab):

   | Variable | Value |
   |----------|-------|
   | `TELEGRAM_BOT_TOKEN` | Your bot token from @BotFather |
   | `OPENAI_API_KEY` | Your OpenAI API key |
   | `PORT` | `3000` (Railway sets this automatically) |

4. **Deploy** — Railway builds and starts the bot automatically. It runs 24/7 for free on the Hobby plan.

That's it — Luna is live and independent, no Replit needed.

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | Show commands |
| `/roleplay [scenario]` | Start a custom role-play scene |
| `/reset` | Clear conversation history |

## Local Setup

```bash
git clone https://github.com/Agrim777/luna-telegram-ai-bot.git
cd luna-telegram-ai-bot
pnpm install

# Set env vars
export TELEGRAM_BOT_TOKEN=your_token_here
export OPENAI_API_KEY=your_key_here
export PORT=5000

pnpm --filter @workspace/api-server run dev
```

## Tech Stack

- **Bot:** [Telegraf](https://telegraf.js.org/) — Telegram Bot API framework
- **AI:** OpenAI GPT-4o-mini via `openai` SDK
- **Server:** Express 5 (health endpoint + bot process)
- **Runtime:** Node.js 22, TypeScript 5.9
- **Package manager:** pnpm workspaces
- **Deploy:** Railway (Nixpacks, auto-detects pnpm)

## Project Structure

```
artifacts/api-server/src/
  telegram/
    bot.ts          # Telegraf handlers & command routing
    personas.ts     # Luna's personality & system prompts
    conversations.ts # In-memory conversation history (per chat ID)
  app.ts            # Express app
  index.ts          # Entry point — starts server + bot

railway.json        # Railway build & start config
nixpacks.toml       # Nixpacks build phases
```

## Notes

- Conversation history is **in-memory** — resets on server restart
- Each session auto-expires after **24 hours** of inactivity
- OpenAI's content policy applies — for fully uncensored responses consider switching to a provider like Together AI or Mistral with a suitable model
- The bot token was regenerated for security — always revoke exposed tokens via @BotFather
