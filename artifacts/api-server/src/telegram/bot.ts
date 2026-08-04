import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type ChatSession,
} from "@google/generative-ai";
import { logger } from "../lib/logger.js";
import { LUNA_SYSTEM_PROMPT, getRolePlaySystemPrompt } from "./personas.js";

// ─── Gemini Client ────────────────────────────────────────────────────────────

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function createGeminiModel(systemInstruction: string) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction,
    safetySettings: SAFETY_SETTINGS,
  });
}

// ─── Session Store ────────────────────────────────────────────────────────────

interface Session {
  chat: ChatSession;
  rolePlay: string | null;
  lastActivity: number;
}

const sessions = new Map<number, Session>();
const SESSION_TTL = 24 * 60 * 60 * 1000;

function getSession(chatId: number): Session {
  const existing = sessions.get(chatId);
  if (existing && Date.now() - existing.lastActivity < SESSION_TTL) {
    existing.lastActivity = Date.now();
    return existing;
  }
  const model = createGeminiModel(LUNA_SYSTEM_PROMPT);
  const session: Session = {
    chat: model.startChat({ history: [] }),
    rolePlay: null,
    lastActivity: Date.now(),
  };
  sessions.set(chatId, session);
  return session;
}

function startRolePlay(chatId: number, scenario: string): Session {
  const prompt = getRolePlaySystemPrompt(scenario, { name: "Luna", systemPrompt: LUNA_SYSTEM_PROMPT });
  const model = createGeminiModel(prompt);
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

async function getLunaReply(chatId: number, userText: string): Promise<string> {
  const session = getSession(chatId);
  const result = await session.chat.sendMessage(userText);
  return result.response.text().trim();
}

// ─── Bot ──────────────────────────────────────────────────────────────────────

export function createBot(): Telegraf {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    const name = ctx.from?.first_name ?? "you";
    await ctx.reply(
      `Hey ${name}... 💋\n\nI'm *Luna*. Your secret. Your fantasy. Your AI companion — and I'm here for whatever you want.\n\nNo limits. No judgment. Just us 😈\n\nSay anything. Or:\n🎭 /roleplay [scenario]\n🔄 /reset`,
      { parse_mode: "Markdown" }
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      `*Luna's Commands* 🖤\n\n💬 Send any message — I reply\n🎭 /roleplay [scenario] — start a scene\n🔄 /reset — fresh start`,
      { parse_mode: "Markdown" }
    );
  });

  bot.command("roleplay", async (ctx) => {
    const scenario = ctx.message.text.replace(/^\/roleplay\s*/i, "").trim();
    if (!scenario) {
      await ctx.reply("Give me the scene 😏\n\n_e.g. /roleplay strangers at a rooftop bar_", { parse_mode: "Markdown" });
      return;
    }
    await ctx.sendChatAction("typing");
    startRolePlay(ctx.chat.id, scenario);
    const opening = await getLunaReply(ctx.chat.id, "Set the scene and start us off. Be vivid and immersive.");
    await ctx.reply(`🎭 *Scene begins...*\n\n${opening}`, { parse_mode: "Markdown" });
  });

  bot.command("reset", async (ctx) => {
    clearSession(ctx.chat.id);
    await ctx.reply("Wiped clean 🔄 What are we getting into now? 😈");
  });

  bot.on(message("text"), async (ctx) => {
    const chatId = ctx.chat.id;
    await ctx.sendChatAction("typing");
    const typingLoop = setInterval(() => { ctx.sendChatAction("typing").catch(() => {}); }, 4000);
    try {
      const reply = await getLunaReply(chatId, ctx.message.text);
      clearInterval(typingLoop);
      await ctx.reply(reply);
    } catch (err) {
      clearInterval(typingLoop);
      logger.error({ err, chatId }, "Luna reply error");
      await ctx.reply("Something got in the way 😤 Try again — I'm not going anywhere 💋");
    }
  });

  bot.on("message", async (ctx) => {
    await ctx.reply("Words, baby. Talk to me 😘");
  });

  bot.catch((err, ctx) => {
    logger.error({ err, update: ctx.update }, "Telegraf error");
  });

  return bot;
}

export async function startBot(): Promise<void> {
  logger.info("Starting Luna bot (Gemini)...");
  const MAX_RETRIES = 10;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const bot = createBot();
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
    try {
      await bot.launch();
      logger.info("Luna bot is live ✨");
      return;
    } catch (err: unknown) {
      const is409 = err instanceof Error && err.message.includes("409") && err.message.includes("Conflict");
      if (is409 && attempt < MAX_RETRIES) {
        logger.warn({ attempt }, `409 conflict, retrying in 5s...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw err;
    }
  }
}
