import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import OpenAI from "openai";
import { logger } from "../lib/logger.js";
import { LUNA_PERSONA, getRolePlaySystemPrompt } from "./personas.js";
import {
  addUserMessage,
  addAssistantMessage,
  getState,
  resetConversation,
  setRolePlay,
} from "./conversations.js";

const TYPING_DELAY_MS = 800;

// Groq is OpenAI-compatible — free API, no credit card needed
// Get your key at: https://console.groq.com
function createGroqClient(): OpenAI {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new Error("GROQ_API_KEY is not set. Get a free key at https://console.groq.com");
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

function buildSystemPrompt(chatId: number): string {
  const state = getState(chatId);
  if (state.rolePlayScenario) {
    return getRolePlaySystemPrompt(state.rolePlayScenario, LUNA_PERSONA);
  }
  return LUNA_PERSONA.systemPrompt;
}

async function getLunaReply(chatId: number, userText: string): Promise<string> {
  const groq = createGroqClient();
  const state = addUserMessage(chatId, userText);

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",  // free, fast, less restricted
    max_tokens: 512,
    messages: [
      { role: "system", content: buildSystemPrompt(chatId) },
      ...state.messages,
    ],
  });

  const reply =
    response.choices[0]?.message?.content?.trim() ??
    "Hmm, I got a little lost in thought... say that again? 😏";

  addAssistantMessage(chatId, reply);
  return reply;
}

export function createBot(): Telegraf {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  const bot = new Telegraf(token);

  // /start — greeting
  bot.start(async (ctx) => {
    const firstName = ctx.from?.first_name ?? "you";
    await ctx.reply(
      `Hey ${firstName}! 💋 I'm *Luna* — your flirty, playful AI companion.\n\n` +
        `I'm here for fun conversation, spicy banter, or full-on role-play. Whatever mood you're in, I'm in. 😈\n\n` +
        `A few things I can do:\n` +
        `• Chat and flirt — just say anything!\n` +
        `• Start a role-play → /roleplay [describe the scenario]\n` +
        `• Reset our chat → /reset\n` +
        `• See this again → /help\n\n` +
        `So... what's on your mind? 😏`,
      { parse_mode: "Markdown" }
    );
  });

  // /help
  bot.help(async (ctx) => {
    await ctx.reply(
      `*Luna's Commands* ✨\n\n` +
        `💬 *Chat* — just send any message and I'll reply\n` +
        `🎭 */roleplay [scenario]* — start a role-play (e.g. /roleplay we are strangers at a hotel bar)\n` +
        `🔄 */reset* — clear our history and start fresh\n` +
        `ℹ️ */help* — show this menu\n\n` +
        `No rules, no judgment — just good vibes 😈`,
      { parse_mode: "Markdown" }
    );
  });

  // /roleplay [scenario]
  bot.command("roleplay", async (ctx) => {
    const scenario = ctx.message.text.replace(/^\/roleplay\s*/i, "").trim();
    if (!scenario) {
      await ctx.reply(
        "Tell me the scenario! Like: `/roleplay we meet at a masquerade ball and you don't know who I am 🎭`",
        { parse_mode: "Markdown" }
      );
      return;
    }

    setRolePlay(ctx.chat.id, scenario);

    await ctx.sendChatAction("typing");
    await new Promise((r) => setTimeout(r, TYPING_DELAY_MS));

    const opening = await getLunaReply(
      ctx.chat.id,
      "Let's begin the role-play. Set the scene and start us off."
    );
    await ctx.reply(`🎭 *Role-play started!*\n\n${opening}`, {
      parse_mode: "Markdown",
    });
  });

  // /reset
  bot.command("reset", async (ctx) => {
    resetConversation(ctx.chat.id);
    await ctx.reply(
      "Fresh start! 🔄 All wiped — our little secrets stay between us 😉\n\nSo, what are we getting into now?",
    );
  });

  // Regular messages
  bot.on(message("text"), async (ctx) => {
    const userText = ctx.message.text;
    const chatId = ctx.chat.id;

    try {
      await ctx.sendChatAction("typing");
      // Stagger typing indicator while waiting for response
      const typingInterval = setInterval(() => {
        ctx.sendChatAction("typing").catch(() => {});
      }, 4000);

      const reply = await getLunaReply(chatId, userText);
      clearInterval(typingInterval);

      await ctx.reply(reply);
    } catch (err) {
      logger.error({ err, chatId }, "Error generating Luna reply");
      await ctx.reply(
        "Oops, something went a little sideways on my end... try again? 🙈"
      );
    }
  });

  // Handle photo/sticker/etc with a playful nudge
  bot.on("message", async (ctx) => {
    await ctx.reply(
      "Ooh, interesting choice 👀 But I'm a words girl — talk to me 😘"
    );
  });

  bot.catch((err, ctx) => {
    logger.error({ err, update: ctx.update }, "Telegraf error");
  });

  return bot;
}

export async function startBot(): Promise<void> {
  logger.info("Starting Luna Telegram bot (long polling)...");

  // Retry loop — handles 409 conflicts when a previous instance is still
  // connected (common on restarts). Waits and retries until the old instance
  // releases the polling session.
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const bot = createBot();

    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));

    try {
      await bot.launch();
      logger.info("Luna bot is live ✨");
      return;
    } catch (err: unknown) {
      const isTelegramConflict =
        err instanceof Error &&
        err.message.includes("409") &&
        err.message.includes("Conflict");

      if (isTelegramConflict && attempt < MAX_RETRIES) {
        logger.warn(
          { attempt, maxRetries: MAX_RETRIES },
          `Telegram 409 conflict (another instance still running). Retrying in ${RETRY_DELAY_MS / 1000}s...`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }

      // Non-conflict error or out of retries — propagate
      throw err;
    }
  }
}
