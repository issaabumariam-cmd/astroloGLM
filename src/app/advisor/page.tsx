"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Star, Moon, Heart, AlertCircle, BookOpen, ChevronDown, ChevronUp, Calendar, Loader2, Lock, Crown } from "lucide-react";
import { zodiacSigns, getSignById, elementColors } from "@/lib/astrology/signs";
import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";
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
  isHook?: boolean;
  hookId?: string;
};

type Stage = "choose" | "per-sign" | "onboarding" | "chat";

const COMMON_CITIES: Record<string, { name: string; lat: number; lng: number }> = {
  london: { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  paris: { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  berlin: { name: "Berlin, Germany", lat: 52.52, lng: 13.405 },
  amsterdam: { name: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
  madrid: { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038 },
  rome: { name: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  dublin: { name: "Dublin, Ireland", lat: 53.3498, lng: -6.2603 },
  stockholm: { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
  newyork: { name: "New York, USA", lat: 40.7128, lng: -74.006 },
  amman: { name: "Amman, Jordan", lat: 31.9539, lng: 35.9108 },
  dubai: { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708 },
  istanbul: { name: "Istanbul, Turkey", lat: 41.0082, lng: 28.9784 },
};

const HOOK_QUESTIONS: Record<string, string> = {
  conflict: "How do you handle conflict?",
  energy: "What drains or energizes you?",
  strengths: "What's your hidden strength?",
};

const PER_SIGN_SUGGESTIONS = [
  "What does my sun sign say about my personality?",
  "How will Mercury retrograde affect me?",
  "What's the best career path for my sign?",
  "How can I improve my relationship with a water sign?",
  "What does a full moon mean for my sign?",
];

export default function AdvisorPage() {
  const [stage, setStage] = useState<Stage>("choose");
  const [selectedSign, setSelectedSign] = useState<string>("aries");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [cityKey, setCityKey] = useState("london");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Per-sign chat (free, no birth date)
  const startPerSignChat = (signId: string) => {
    setSelectedSign(signId);
    setIsPersonalized(false);
    setExchangeCount(0);
    setShowUpgrade(false);
    setMessages([
      {
        role: "assistant",
        content: `Hi! I'm Jehana. I see you're a ${getSignById(signId)?.name} — ${getSignById(signId)?.element} energy, ruled by ${getSignById(signId)?.rulingPlanet}. ${getSignById(signId)?.personality?.substring(0, 150) || ""}... Ask me anything about your sign, transits, or the cosmic weather.`,
      },
    ]);
    setStage("chat");
  };

  // Personalized onboarding (free, 3 hook exchanges)
  const startOnboarding = async () => {
    if (!birthDate) return;
    setLoading(true);
    setError(null);

    try {
      const city = COMMON_CITIES[cityKey] || COMMON_CITIES.london;
      const response = await fetch("/api/echo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "intro",
          birthDate,
          birthTime: birthTime || undefined,
          lat: city.lat,
          lng: city.lng,
          birthPlace: city.name,
        }),
      });

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();

      const sign = getSignById(data.chart.sun.sign.toLowerCase());
      setSelectedSign(sign?.id || "aries");
      setIsPersonalized(true);
      setExchangeCount(0);
      setShowUpgrade(false);

      const introMessages: Message[] = [
        { role: "assistant", content: data.intro.greeting },
        { role: "assistant", content: data.intro.personalitySummary },
      ];

      data.intro.hookQuestions.forEach((hook: { id: string }) => {
        introMessages.push({
          role: "assistant",
          content: "",
          isHook: true,
          hookId: hook.id,
        });
      });

      introMessages.push({ role: "assistant", content: data.intro.followUp });
      setMessages(introMessages);
      setStage("chat");
    } catch {
      setError("Jehana couldn't connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming || showUpgrade) return;

    // Free tier limit: 3 exchanges for personalized, unlimited for per-sign
    if (isPersonalized && exchangeCount >= 3) {
      setShowUpgrade(true);
      return;
    }

    setChatError(null);
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const sign = getSignById(selectedSign);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => !m.isHook)
            .map((m) => ({ role: m.role, content: m.content })),
          signContext: sign
            ? { sign: sign.name, element: sign.element, rulingPlanet: sign.rulingPlanet }
            : undefined,
        }),
      });

      if (!response.ok) throw new Error("AI service unavailable");

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

      if (isPersonalized) {
        setExchangeCount((c) => c + 1);
      }
    } catch {
      setChatError("The cosmos seems busy right now. Please try again in a moment.");
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setStreaming(false);
    }
  };

  // CHOOSE STAGE: two options
  if (stage === "choose") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="text-center">
          <ZodiacWheel size={88} className="mx-auto text-primary spin-slow" />
          <Eyebrow className="mt-4">Meet Jehana — Your Astrological Guide</Eyebrow>
          <h1 className="heading-serif mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
            How would you like to begin?
          </h1>
        </div>

        <div className="mt-8 space-y-4">
          {/* Option 1: Per-sign (free, quick) */}
          <div className="card card-hover cursor-pointer p-6" onClick={() => setStage("per-sign")}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-semibold text-foreground">Quick Chat</h3>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Free</span>
                </div>
                <p className="mt-1 text-sm text-foreground-muted">
                  Pick your zodiac sign and start chatting. No birth date needed —
                  general guidance based on your sun sign.
                </p>
              </div>
            </div>
          </div>

          {/* Option 2: Personalized (free, 3 exchanges) */}
          <div className="card card-hover cursor-pointer p-6" onClick={() => setStage("onboarding")}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-semibold text-foreground">Personalized Reading</h3>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">3 Free Questions</span>
                </div>
                <p className="mt-1 text-sm text-foreground-muted">
                  Enter your birth date. Jehana reads your chart, introduces you to yourself,
                  and asks personalized questions about your strengths, conflicts, and energy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PER-SIGN STAGE: pick a sign
  if (stage === "per-sign") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="text-center">
          <Eyebrow>Quick Chat · Free</Eyebrow>
          <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground">
            Choose Your Sign
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Start chatting about your sign — no birth date needed.
          </p>
        </div>

        <Card className="mt-8 p-6">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {zodiacSigns.map((sign) => (
              <button
                key={sign.id}
                onClick={() => startPerSignChat(sign.id)}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 transition-all hover:border-primary-light hover:bg-surface-muted"
              >
                <span className="text-2xl" style={{ color: elementColors[sign.element] }}>{sign.glyph}</span>
                <span className="text-xs font-medium">{sign.name}</span>
              </button>
            ))}
          </div>
        </Card>
        <button onClick={() => setStage("choose")} className="btn-ghost mt-4 text-xs">
          ← Back
        </button>
      </div>
    );
  }

  // ONBOARDING STAGE: birth date input
  if (stage === "onboarding") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="text-center">
          <ZodiacWheel size={72} className="mx-auto text-primary spin-slow" />
          <Eyebrow className="mt-4">Personalized Reading · 3 Free Questions</Eyebrow>
          <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground">
            Enter your birth date.
          </h1>
          <p className="mt-3 text-sm text-foreground-muted">
            Jehana reads your chart and starts a conversation — about your strengths,
            your challenges, and what makes you uniquely you.
          </p>
        </div>

        <Card className="mt-8 p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                <Calendar className="h-4 w-4 text-primary" /> Birth Date
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                min="1900-01-01"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                <Calendar className="h-4 w-4 text-primary" /> Birth Time
                <span className="text-xs text-foreground-subtle">(optional — improves accuracy)</span>
              </label>
              <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                <Calendar className="h-4 w-4 text-primary" /> Birth Location
              </label>
              <select value={cityKey} onChange={(e) => setCityKey(e.target.value)} className="input-field cursor-pointer">
                {Object.entries(COMMON_CITIES).map(([key, city]) => (
                  <option key={key} value={key}>{city.name}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <button onClick={startOnboarding} disabled={!birthDate || loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Jehana is reading your chart...</> : <><Sparkles className="h-4 w-4" /> Meet Jehana — Free</>}
            </button>
          </div>
        </Card>
        <button onClick={() => setStage("choose")} className="btn-ghost mt-4 text-xs">
          ← Back
        </button>
      </div>
    );
  }

  // CHAT STAGE
  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-foreground">Jehana</h1>
            <p className="text-xs text-foreground-subtle">
              {getSignById(selectedSign)?.name}
              {isPersonalized ? " · Personalized" : " · Per Sign"}
              {isPersonalized && ` · ${3 - exchangeCount} free left`}
              {" · "}
              {streaming ? "Typing..." : "Ready"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([]);
            setExchangeCount(0);
            setShowUpgrade(false);
            setStage("choose");
          }}
          className="btn-ghost text-xs"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => {
            if (msg.isHook) return null;
            return (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm", msg.role === "user" ? "bg-primary text-surface" : "bg-primary/10 text-primary")}>
                  {msg.role === "user" ? "You" : "✦"}
                </div>
                <div className="max-w-[85%]">
                  <div className={cn("rounded-lg px-4 py-3 text-sm leading-relaxed", msg.role === "user" ? "bg-primary text-surface" : "bg-surface-muted text-foreground")}>
                    {msg.content || (streaming ? "..." : "")}
                  </div>
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && msg.content && (
                    <SourcesPanel sources={msg.sources} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Hook question buttons (shown when available and not streaming) */}
          {messages.some((m) => m.isHook) && !streaming && !showUpgrade && (
            <div className="flex flex-col gap-2 pl-11">
              {messages.filter((m) => m.isHook).map((hook, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessages((prev) => prev.filter((m) => !m.isHook));
                    sendMessage(HOOK_QUESTIONS[hook.hookId || ""] || "Tell me more");
                  }}
                  className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-left text-sm text-foreground-muted transition-all hover:border-primary hover:bg-primary/10"
                >
                  <span className="font-medium text-primary">?</span> {HOOK_QUESTIONS[hook.hookId || ""] || "Tell me more"}
                </button>
              ))}
            </div>
          )}

          {/* Per-sign suggestions (shown when empty and not personalized) */}
          {messages.length === 1 && !isPersonalized && !streaming && (
            <div className="flex flex-col gap-2 pl-11">
              {PER_SIGN_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-left text-sm text-foreground-muted transition-all hover:border-primary hover:bg-primary/10"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Upgrade prompt */}
          {showUpgrade && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  You've used your 3 free questions. Unlock unlimited chat with Premium.
                </p>
              </div>
              <a href="/pricing" className="btn-primary mt-3 text-sm">
                <Crown className="h-3.5 w-3.5" /> Unlock Premium — £5.99/month
              </a>
            </div>
          )}

          {chatError && (
            <div className="flex items-center gap-2 rounded-lg bg-error-light px-4 py-3 text-sm text-error">
              <AlertCircle className="h-4 w-4" />
              {chatError}
            </div>
          )}
          <div ref={endRef} />
        </div>
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
          placeholder={showUpgrade ? "Unlock Premium to continue chatting..." : "Ask Jehana anything..."}
          className="input-field flex-1"
          disabled={streaming || showUpgrade}
        />
        <button type="submit" disabled={!input.trim() || streaming || showUpgrade} className="btn-primary disabled:opacity-50">
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
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{sources.length} passages</span>
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {sources.map((source, i) => (
            <div key={i} className="rounded-md bg-surface-muted/60 p-3">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                Chapter {source.chapter_num}: {source.chapter_title}
                {source.score !== undefined && <span className="ml-2 text-foreground-subtle">{(source.score * 100).toFixed(0)}% match</span>}
              </p>
              <p className="text-xs leading-relaxed text-foreground-muted line-clamp-4">&ldquo;{source.text}&rdquo;</p>
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