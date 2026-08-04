# Luna — AI Adult Companion Telegram Bot 🔥

Seductive, uninhibited AI companion. Explicit dirty talk, role-play, no limits.
Powered by **Google Gemini 1.5 Flash** (free tier). Deployed on **Railway** in minutes.

---

## 🚀 Railway Deploy (Step by Step)

### Step 1 — Delete old services

In your Railway project, **delete all the crashed services** (api-spec, mockup-sandbox, api-zod, api-client-react, db). Keep only `api-server` or start fresh.

**Why they crashed:** Railway detected every pnpm workspace package. The fix is to point Railway at the `bot/` folder which is fully self-contained.

### Step 2 — Create a new service pointing to `bot/`

1. Railway dashboard → **New Service** → **GitHub Repo** → pick `luna-telegram-ai-bot`
2. In service settings → **Source** → **Root Directory** → type `bot`
3. Railway will re-detect — it will find only the `bot/package.json`

### Step 3 — Set environment variables

In the service → **Variables** tab:

| Variable | Value |
|----------|-------|
| `TELEGRAM_BOT_TOKEN` | from [@BotFather](https://t.me/BotFather) |
| `GEMINI_API_KEY` | from [aistudio.google.com](https://aistudio.google.com) → Get API Key |

### Step 4 — Deploy

Railway builds and starts automatically. Luna is live in ~1 minute. ✨

---

## 💻 Run Locally

```bash
git clone https://github.com/Agrim777/luna-telegram-ai-bot.git
cd luna-telegram-ai-bot/bot
npm install

# Create .env file
echo "TELEGRAM_BOT_TOKEN=your_token" > .env
echo "GEMINI_API_KEY=your_key" >> .env

npm run dev
```

---

## Bot Commands

| Command | What it does |
|---------|-------------|
| `/start` | Wake Luna up |
| `/help` | Show commands |
| `/roleplay [scenario]` | Start an immersive role-play |
| `/reset` | Clear history, fresh start |

---

## Tech

- **Telegram:** [Telegraf](https://telegraf.js.org/) v4
- **AI:** Google Gemini 1.5 Flash — safety filters disabled
- **Runtime:** Node.js 22, TypeScript via tsx
- **Deploy:** Railway (root dir → `bot/`)

## Project Structure

```
bot/                   ← deploy THIS folder on Railway
  src/index.ts         ← entire bot in one file
  package.json
  nixpacks.toml        ← Railway build config

artifacts/api-server/  ← Replit only (ignore on Railway)
lib/                   ← Replit only (ignore on Railway)
```
