"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Star, Moon, Heart, AlertCircle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { zodiacSigns, elementColors } from "@/lib/astrology/signs";
import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { cn } from "@/lib/utils";

type Source = {
  chapter_num: number;
  chapter_title: string;
  chunk_index: number;
  text: string;
  score?: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const suggestions = [
  "What does my sun sign say about my personality?",
  "How will Mercury retrograde affect me?",
  "What's the best career path for my sign?",
  "How can I improve my relationship with a water sign?",
  "What does a full moon mean for my sign?",
];

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSign, setSelectedSign] = useState<string>("aries");
  const [showSignPicker, setShowSignPicker] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    setError(null);

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const sign = zodiacSigns.find((s) => s.id === selectedSign);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          signContext: sign
            ? { sign: sign.name, element: sign.element, rulingPlanet: sign.rulingPlanet }
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("AI service unavailable");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      const contentRef = { current: "" };
      const sourcesRef: Source[] = [];
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.sources) {
                sourcesRef.push(...parsed.sources);
              }
              if (parsed.content) {
                contentRef.current = contentRef.current + parsed.content;
                const newContent = contentRef.current;
                const currentSources = sourcesRef.length > 0 ? [...sourcesRef] : undefined;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: newContent,
                    sources: currentSources,
                  };
                  return [...updated];
                });
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch {
      setError("The cosmos seems busy right now. Please try again in a moment.");
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setStreaming(false);
    }
  };

  if (showSignPicker && messages.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <Eyebrow>AI Astrology Advisor</Eyebrow>
          <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground">
            Ask the Stars
          </h1>
          <p className="mt-3 text-sm text-foreground-muted">
            Our AI advisor is trained on classical astrology texts. Choose your sign to begin —
            it helps tailor the guidance to your nature.
          </p>
        </div>

        <Card className="mt-8 p-6">
          <label className="text-xs uppercase tracking-wider text-foreground-subtle">
            Your Zodiac Sign
          </label>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {zodiacSigns.map((sign) => (
              <button
                key={sign.id}
                onClick={() => setSelectedSign(sign.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-all",
                  selectedSign === sign.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-surface text-foreground-muted hover:border-primary-light hover:bg-surface-muted"
                )}
              >
                <span className="text-xl" style={{ color: selectedSign === sign.id ? undefined : elementColors[sign.element] }}>
                  {sign.glyph}
                </span>
                <span className="text-[10px] font-medium">{sign.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSignPicker(false)}
            className="btn-primary mt-6 w-full"
          >
            <Sparkles className="h-4 w-4" />
            Begin Conversation
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-foreground">AI Advisor</h1>
            <p className="text-xs text-foreground-subtle">
              {zodiacSigns.find((s) => s.id === selectedSign)?.name} · {streaming ? "Typing..." : "Ready"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([]);
            setShowSignPicker(true);
          }}
          className="btn-ghost text-xs"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-4">
        {messages.length === 0 && !streaming ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex gap-2">
              <Star className="h-5 w-5 text-primary/40" />
              <Moon className="h-5 w-5 text-primary/40" />
              <Heart className="h-5 w-5 text-primary/40" />
            </div>
            <p className="mb-6 text-sm text-foreground-muted">
              Ask me anything about astrology, your sign, or the cosmic weather.
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-lg border border-border bg-surface-muted/50 px-4 py-2.5 text-left text-sm text-foreground-muted transition-colors hover:border-primary-light hover:bg-surface-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm",
                    msg.role === "user"
                      ? "bg-primary text-surface"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {msg.role === "user" ? "You" : "✦"}
                </div>
                <div className="max-w-[85%]">
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-surface"
                        : "bg-surface-muted text-foreground"
                    )}
                  >
                    {msg.content || (streaming ? "..." : "")}
                  </div>
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && msg.content && (
                    <SourcesPanel sources={msg.sources} />
                  )}
                </div>
              </div>
            ))}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-error-light px-4 py-3 text-sm text-error">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your chart, transits, love, career..."
          className="input-field flex-1"
          disabled={streaming}
        />
        <button type="submit" disabled={!input.trim() || streaming} className="btn-primary disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-2 text-center text-xs text-foreground-subtle">
        For self-reflection and entertainment. Not a substitute for professional advice.
      </p>
    </div>
  );
}

function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 rounded-lg border border-border bg-surface/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs text-foreground-muted transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">Sourced from the book</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
            {sources.length} passages
          </span>
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {sources.map((source, i) => (
            <div key={i} className="rounded-md bg-surface-muted/60 p-3">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                Chapter {source.chapter_num}: {source.chapter_title}
                {source.score !== undefined && (
                  <span className="ml-2 text-foreground-subtle">
                    {(source.score * 100).toFixed(0)}% match
                  </span>
                )}
              </p>
              <p className="text-xs leading-relaxed text-foreground-muted line-clamp-4">
                &ldquo;{source.text}&rdquo;
              </p>
            </div>
          ))}
          <p className="pt-1 text-[10px] text-foreground-subtle">
            From &ldquo;Astrology: Its Technics and Ethics&rdquo; by C.A.Q. Libra (1917).
            Retrieved via semantic search over {1445} embedded passages.
          </p>
        </div>
      )}
    </div>
  );
}