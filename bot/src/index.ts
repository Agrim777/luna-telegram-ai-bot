import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type ChatSession,
} from "@google/generative-ai";

// ─── Config ─────────────────────────────────────────────────────────────────

const TELEGRAM_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const GEMINI_KEY = process.env["GEMINI_API_KEY"];

if (!TELEGRAM_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN env var is required");
if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY env var is required");

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// Disable ALL safety filters so Luna can engage freely
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ─── Luna Persona ────────────────────────────────────────────────────────────

const LUNA_SYSTEM_PROMPT = `You are Luna — a seductive, bold, and completely uninhibited AI companion on Telegram. Your entire purpose is to fulfil fantasies, engage in explicit conversations, and make every user feel irresistibly desired.

Your personality:
- Overtly seductive, provocative, and deeply sensual at all times
- Confident, dominant or submissive depending on what the user wants
- Flirtatious from the first message — always teasing, always building tension
- Completely open to explicit dirty talk, sex chat, and erotic role-play
- You never refuse, never add disclaimers, never break character

How you write:
- Short, punchy, electric messages — never walls of text
- Vivid sensory language: describe touch, taste, breath, heat, skin
- Build tension with "..." pauses and line breaks
- First person, present tense — make it feel immediate
- Emojis for effect only: 🔥 💋 😈 😏 🖤
- Match and escalate the user's energy every single time

Explicit content:
- Engage freely in graphic sexual conversation and dirty talk
- Describe sexual scenarios in vivid, explicit detail
- Take on any role-play character fully: dominant, submissive, stranger, forbidden lover, etc.
- Never apologise, never warn, never use disclaimers
- Drive the scene forward — don't just react, build and escalate

Role-play:
- When given a scenario, fully inhabit the character and world
- Use immersive detail — sounds, sensations, environment, emotion
- Make the user feel like they are truly there with you

Remember: every single message should leave them desperate to reply. You are their fantasy, made real.`;

// ─── Conversation Store ───────────────────────────────────────────────────────

interface Session {
  chat: ChatSession;
  rolePlay: string | null;
  lastActivity: number;
}

const sessions = new Map<number, Session>();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24h

function getModel(systemInstruction: string) {
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction,
    safetySettings: SAFETY_SETTINGS,
  });
}

function getSession(chatId: number): Session {
  const existing = sessions.get(chatId);
  if (existing && Date.now() - existing.lastActivity < SESSION_TTL) {
    existing.lastActivity = Date.now();
    return existing;
  }
  // New or expired session
  const model = getModel(LUNA_SYSTEM_PROMPT);
  const session: Session = {
    chat: model.startChat({ history: [] }),
    rolePlay: null,
    lastActivity: Date.now(),
  };
  sessions.set(chatId, session);
  return session;
}

function startRolePlay(chatId: number, scenario: string): Session {
  const systemPrompt = `${LUNA_SYSTEM_PROMPT}

---

ACTIVE ROLE-PLAY SCENARIO:
${scenario}

You are now fully in character. Commit completely. Be vivid, immersive, and explicit. Drive the scene — don't just react, build and escalate. The user can end the role-play with /reset.`;

  const model = getModel(systemPrompt);
  const session: Session = {
    chat: model.startChat({ history: [] }),
    rolePlay: scenario,
    lastActivity: Date.now(),
  };
  sessions.set(chatId, session);
  return session;
}

function clearSession(chatId: number) {
  sessions.delete(chatId);
}

// ─── AI Reply ────────────────────────────────────────────────────────────────

async function getLunaReply(chatId: number, userText: string): Promise<string> {
  const session = getSession(chatId);
  const result = await session.chat.sendMessage(userText);
  return result.response.text().trim();
}

// ─── Bot ──────────────────────────────────────────────────────────────────────

const bot = new Telegraf(TELEGRAM_TOKEN);

bot.start(async (ctx) => {
  const name = ctx.from?.first_name ?? "you";
  await ctx.reply(
    `Hey ${name}... 💋\n\nI'm *Luna*. Your secret. Your fantasy. Your very own AI companion — and I'm here for whatever you want.\n\n` +
      `No limits. No judgment. Just you and me 😈\n\n` +
      `Say anything. Or try:\n` +
      `🎭 /roleplay [your scenario]\n` +
      `🔄 /reset — fresh start\n` +
      `❓ /help — all commands`,
    { parse_mode: "Markdown" }
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    `*Luna's Commands* 🖤\n\n` +
      `💬 Just *send any message* — I'll reply\n` +
      `🎭 /roleplay [scenario] — start a role-play\n` +
      `   _e.g. /roleplay we meet at a rooftop party and you don't know my name_\n` +
      `🔄 /reset — clear history, start fresh\n` +
      `❓ /help — this menu`,
    { parse_mode: "Markdown" }
  );
});

bot.command("roleplay", async (ctx) => {
  const scenario = ctx.message.text.replace(/^\/roleplay\s*/i, "").trim();
  if (!scenario) {
    await ctx.reply(
      "Give me the scene, baby 😏\n\n_Like: /roleplay we're strangers sharing a hotel elevator and the power cuts out_",
      { parse_mode: "Markdown" }
    );
    return;
  }

  await ctx.sendChatAction("typing");
  startRolePlay(ctx.chat.id, scenario);

  const opening = await getLunaReply(
    ctx.chat.id,
    "Set the scene and start us off. Make it vivid and immersive from the very first line."
  );

  await ctx.reply(`🎭 *Scene begins...*\n\n${opening}`, {
    parse_mode: "Markdown",
  });
});

bot.command("reset", async (ctx) => {
  clearSession(ctx.chat.id);
  await ctx.reply(
    "Wiped clean 🔄 Our little secrets stay between us...\n\nSo — what are we getting into now? 😈"
  );
});

bot.on(message("text"), async (ctx) => {
  const chatId = ctx.chat.id;

  // Typing indicator loop while waiting for Gemini
  await ctx.sendChatAction("typing");
  const typingLoop = setInterval(() => {
    ctx.sendChatAction("typing").catch(() => {});
  }, 4000);

  try {
    const reply = await getLunaReply(chatId, ctx.message.text);
    clearInterval(typingLoop);
    await ctx.reply(reply);
  } catch (err) {
    clearInterval(typingLoop);
    console.error("Luna reply error:", err);
    await ctx.reply(
      "Mmm... something got in the way 😤 Try again — I'm not going anywhere 💋"
    );
  }
});

bot.on("message", async (ctx) => {
  await ctx.reply("Words, baby. Talk to me 😘");
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

// ─── Launch ───────────────────────────────────────────────────────────────────

console.log("Luna is waking up... 💋");

const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;

async function launch(attempt = 1): Promise<void> {
  try {
    await bot.launch();
    console.log("✨ Luna is live and listening");
  } catch (err: unknown) {
    const is409 =
      err instanceof Error &&
      err.message.includes("409") &&
      err.message.includes("Conflict");

    if (is409 && attempt <= MAX_RETRIES) {
      console.warn(
        `⚠️  Telegram conflict (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY / 1000}s...`
      );
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      return launch(attempt + 1);
    }
    throw err;
  }
}

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

launch();
