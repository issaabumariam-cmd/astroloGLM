"use client";

const STORAGE_KEY = "astrolo_chat_history";
const MAX_THREADS = 10;
const MAX_MESSAGES_PER_THREAD = 50;
const MAX_AGE_DAYS = 30;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  sources?: { chapter_num: number; chapter_title: string; text: string; score?: number }[];
};

export type ChatThread = {
  id: string;
  mode: "echo" | "deep-echo";
  sign?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const threads: ChatThread[] = JSON.parse(raw);
    const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    return threads.filter((t) => t.updatedAt > cutoff).slice(0, MAX_THREADS);
  } catch {
    return [];
  }
}

export function saveThread(thread: ChatThread): void {
  if (typeof window === "undefined") return;
  try {
    const threads = loadThreads();
    const existingIdx = threads.findIndex((t) => t.id === thread.id);
    const trimmedMessages = thread.messages.slice(-MAX_MESSAGES_PER_THREAD);
    const trimmed = { ...thread, messages: trimmedMessages };
    if (existingIdx >= 0) {
      threads[existingIdx] = trimmed;
    } else {
      threads.unshift(trimmed);
    }
    const sorted = threads.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_THREADS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function deleteThread(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const threads = loadThreads();
    const filtered = threads.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // silently fail
  }
}

export function createThread(mode: "echo" | "deep-echo", sign?: string): ChatThread {
  return {
    id: `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    mode,
    sign,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function addMessage(thread: ChatThread, message: ChatMessage): ChatThread {
  const updated = {
    ...thread,
    messages: [...thread.messages, message],
    updatedAt: Date.now(),
  };
  saveThread(updated);
  return updated;
}