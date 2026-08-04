import type OpenAI from "openai";

export type Message = OpenAI.Chat.ChatCompletionMessageParam;

export interface ConversationState {
  messages: Message[];
  rolePlayScenario: string | null;
  lastActivity: number;
}

// In-memory conversation store keyed by Telegram chat ID
const store = new Map<number, ConversationState>();

const MAX_HISTORY = 30; // keep last 30 messages to stay within token limits
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours inactivity = reset

function getOrCreate(chatId: number): ConversationState {
  const existing = store.get(chatId);
  if (existing) {
    // Reset if idle too long
    if (Date.now() - existing.lastActivity > TTL_MS) {
      store.delete(chatId);
    } else {
      existing.lastActivity = Date.now();
      return existing;
    }
  }
  const state: ConversationState = {
    messages: [],
    rolePlayScenario: null,
    lastActivity: Date.now(),
  };
  store.set(chatId, state);
  return state;
}

export function addUserMessage(chatId: number, content: string): ConversationState {
  const state = getOrCreate(chatId);
  state.messages.push({ role: "user", content });
  trimHistory(state);
  return state;
}

export function addAssistantMessage(chatId: number, content: string): void {
  const state = getOrCreate(chatId);
  state.messages.push({ role: "assistant", content });
  trimHistory(state);
}

export function getState(chatId: number): ConversationState {
  return getOrCreate(chatId);
}

export function resetConversation(chatId: number): void {
  store.delete(chatId);
}

export function setRolePlay(chatId: number, scenario: string | null): void {
  const state = getOrCreate(chatId);
  state.rolePlayScenario = scenario;
  // Clear history when switching scenarios for a fresh start
  state.messages = [];
}

function trimHistory(state: ConversationState): void {
  if (state.messages.length > MAX_HISTORY) {
    state.messages = state.messages.slice(state.messages.length - MAX_HISTORY);
  }
}
