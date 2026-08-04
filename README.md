# Luna — Telegram AI Companion Bot 💋

A flirty, playful AI companion Telegram bot powered by OpenAI GPT-4o-mini. Users can chat, flirt, and start immersive role-play scenarios directly in Telegram.

## Features

- 💬 **Natural flirty conversation** — Luna has a warm, witty, and playfully teasing personality
- 🎭 **Role-play mode** — start any scenario with `/roleplay [description]`
- 🧠 **Conversation memory** — remembers context within a session (up to 30 messages)
- 🔄 **Reset anytime** — `/reset` clears history for a fresh start
- ⚡ **Long-polling** — runs without needing a public server or webhook setup

## Tech Stack

- **Runtime:** Node.js 24, TypeScript 5.9
- **Bot framework:** [Telegraf](https://telegraf.js.org/)
- **AI:** OpenAI GPT-4o-mini via `openai` SDK
- **Server:** Express 5 (API health endpoint)
- **Monorepo:** pnpm workspaces

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Introduction and welcome message |
| `/help` | Show all commands |
| `/roleplay [scenario]` | Start a role-play with a custom scenario |
| `/reset` | Clear conversation history |

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/luna-telegram-bot.git
cd luna-telegram-bot
pnpm install
```

### 2. Set environment variables

Create a `.env` file (never commit this):

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
```

### 3. Run

```bash
pnpm --filter @workspace/api-server run dev
```

The bot will start polling Telegram and respond to messages automatically.

## Project Structure

```
artifacts/
  api-server/
    src/
      telegram/
        bot.ts          # Telegraf bot setup & handlers
        personas.ts     # Luna's personality & system prompts
        conversations.ts # In-memory conversation history
      app.ts            # Express app
      index.ts          # Entry point (starts both server + bot)
lib/
  db/                   # Drizzle ORM (PostgreSQL)
  api-spec/             # OpenAPI spec & codegen
```

## Notes

- Conversation history is stored **in-memory** — it resets if the server restarts
- Each chat session auto-expires after 24 hours of inactivity
- The bot handles one user persona (Luna) across all chats
