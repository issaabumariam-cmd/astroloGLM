"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Star, AlertCircle, BookOpen, ChevronDown, ChevronUp, Calendar, Clock, Crown, ArrowRight, MapPin } from "lucide-react";
import { zodiacSigns, getSignById, elementColors } from "@/lib/astrology/signs";
import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";
import { GeoSearch } from "@/components/shared/geo-search";
import { ChartReveal } from "@/components/shared/chart-reveal";
import { StreamedIntro } from "@/components/shared/streamed-intro";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { saveBirthData, loadBirthData, getAiUsage } from "@/lib/auth/birth-data";
import { cn } from "@/lib/utils";

type Source = {
  chapter_num: number;
  chapter_title: string;
  chunk_index: number;
  text: string;
  score?: number;
};

type RagMeta = {
  method: string;
  topScore: number | null;
  queryDims: number | null;
  bookChunks: number;
  embeddedChunks: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  rag?: RagMeta;
  isHook?: boolean;
  hookId?: string;
};

type HookQuestion = {
  id: string;
  question: string;
  chartBasis: string;
  responseHint: string;
};

type ChartData = {
  sun: { signName: string; degreesInSign: number; signId: string };
  moon: { signName: string; degreesInSign: number; signId: string };
  rising: { signName: string; degreesInSign: number; signId: string };
  planets: { name: string; signName: string; degreesInSign: number; house?: number; retrograde?: boolean }[];
  houses: { num: number; signId: string; cusp: number }[];
  aspects: { planet1: string; planet2: string; type: string; orb: number; glyph: string }[];
};

type Stage = "welcome" | "echo-pick" | "deep-onboard" | "guided-onboard" | "chat";

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

export default function JehanaPage() {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("welcome");
  const [selectedSign, setSelectedSign] = useState<string>("aries");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthLat, setBirthLat] = useState<number | undefined>();
  const [birthLng, setBirthLng] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [hookQuestions, setHookQuestions] = useState<HookQuestion[]>([]);
  const [freeLimit, setFreeLimit] = useState(3);
  const [freeUsed, setFreeUsed] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showAddTime, setShowAddTime] = useState(false);
  const [guidedHookIdx, setGuidedHookIdx] = useState(0);
  const [guidedUserAnswer, setGuidedUserAnswer] = useState("");
  const [guidedResponse, setGuidedResponse] = useState<string | null>(null);
  const [guidedLoading, setGuidedLoading] = useState(false);
  const [guidedChart, setGuidedChart] = useState<{ sun: { sign: string; degrees: number; glyph: string }; moon: { sign: string; degrees: number; glyph: string }; rising: { sign: string; degrees: number; glyph: string }; birthDateOnly: boolean } | null>(null);
  const [guidedIntro, setGuidedIntro] = useState<{ greeting: string; personalitySummary: string; hookQuestions: HookQuestion[]; followUp: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pinnedToBottomRef = useRef(true);

  // Track whether user is near the bottom of the scroll container
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedToBottomRef.current = distFromBottom < 80;
  };

  // Only auto-scroll if user was already at the bottom (don't yank on manual scroll-up)
  useEffect(() => {
    if (pinnedToBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Check for returning user with saved birth data
  useEffect(() => {
    if (!user) return;
    loadBirthData().then(async (data) => {
      if (data && data.birthDate) {
        // Returning user — pre-fill and offer to skip
        setBirthDate(data.birthDate);
        setBirthTime(data.birthTime || "");
        setBirthPlace(data.birthPlace || "");
        setBirthLat(data.birthLat);
        setBirthLng(data.birthLng);
        const usage = await getAiUsage();
        if (usage) {
          setFreeUsed(usage.used);
          setFreeLimit(usage.limit);
          setIsPremium(usage.isPremium);
        }
      }
    });
  }, [user]);

  // Progressive loading hints
  useEffect(() => {
    if (!loading) return;
    const hints = [
      "Calculating your planetary positions...",
      "Reading your houses and aspects...",
      "Jehana is listening to your chart...",
    ];
    let idx = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingHint(hints[0]);
    const interval = setInterval(() => {
      idx++;
      if (idx < hints.length) setLoadingHint(hints[idx]);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  const startEchoChat = (signId: string) => {
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

  const startDeepEcho = async () => {
    if (!birthDate || birthLat === undefined || birthLng === undefined) {
      setError("Please enter your birth date and birth location.");
      return;
    }

    setLoading(true);
    setError(null);
    setStage("deep-onboard");

    try {
      // Calculate natal chart
      const chartResponse = await fetch("/api/birth-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          birthTime: birthTime || undefined,
          lat: birthLat,
          lng: birthLng,
          birthPlace,
        }),
      });

      if (!chartResponse.ok) throw new Error("Chart calculation failed");
      const chart = await chartResponse.json();
      setChartData(chart);

      // Fetch Jehana intro
      const echoResponse = await fetch("/api/echo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "intro",
          birthDate,
          birthTime: birthTime || undefined,
          lat: birthLat,
          lng: birthLng,
          birthPlace,
        }),
      });

      if (!echoResponse.ok) throw new Error("Jehana couldn't connect");
      const data = await echoResponse.json();

      const sign = getSignById(data.chart.sun.sign.toLowerCase());
      setSelectedSign(sign?.id || "aries");
      setIsPersonalized(true);
      setExchangeCount(0);
      setShowUpgrade(false);
      setHookQuestions(data.intro.hookQuestions || []);

      // Save birth data to profile
      await saveBirthData({
        birthDate,
        birthTime: birthTime || undefined,
        birthPlace,
        birthLat,
        birthLng,
        zodiacSign: sign?.id,
      });

      // Build initial messages
      const introMessages: Message[] = [
        { role: "assistant", content: data.intro.greeting },
        { role: "assistant", content: data.intro.personalitySummary },
      ];

      data.intro.hookQuestions?.forEach((hook: HookQuestion) => {
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

      // If no birth time, show add-time prompt
      if (!birthTime) setShowAddTime(true);
    } catch {
      setError("Jehana couldn't connect. Please try again.");
      setStage("welcome");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming || showUpgrade) return;

    // Check free limit client-side
    if (isPersonalized && !isPremium && exchangeCount >= freeLimit) {
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

    // Get Supabase access token for server-side auth
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    const payload = {
      messages: newMessages
        .filter((m) => !m.isHook)
        .map((m) => ({ role: m.role, content: m.content })),
      chartData: chartData || undefined,
      signContext: !chartData && sign
        ? { sign: sign.name, element: sign.element, rulingPlanet: sign.rulingPlanet }
        : undefined,
      tier: isPersonalized ? "premium" : "free",
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 402) {
        setShowUpgrade(true);
        setStreaming(false);
        setMessages((prev) => prev.filter((m) => m !== userMsg));
        return;
      }

      if (!response.ok) throw new Error("AI service unavailable");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      const contentRef = { current: "" };
      const sourcesRef: Source[] = [];
      const ragRef: { current: RagMeta | undefined } = { current: undefined };
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
              if (parsed.rag) ragRef.current = parsed.rag;
              if (parsed.sources) sourcesRef.push(...parsed.sources);
              if (parsed.content) {
                contentRef.current = contentRef.current + parsed.content;
                const newContent = contentRef.current;
                const currentSources = sourcesRef.length > 0 ? [...sourcesRef] : undefined;
                const currentRag = ragRef.current;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: newContent,
                    sources: currentSources,
                    rag: currentRag,
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

      if (isPersonalized && !isPremium) {
        setExchangeCount((c) => c + 1);
        setFreeUsed((u) => u + 1);
      }
    } catch {
      setChatError("The cosmos seems busy right now. Please try again in a moment.");
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setStreaming(false);
    }
  };

  // WELCOME STAGE
  if (stage === "welcome") {
    const hasSavedBirthData = birthDate && birthLat !== undefined;
    return (
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-12">
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]"
          style={{ width: "900px", height: "900px" }}
        >
          <ZodiacWheel size={900} className="text-primary" />
        </div>

        <div className="relative z-10 w-full max-w-xl">
          <div className="fade-in text-center">
            <ZodiacWheel size={96} className="mx-auto text-primary spin-slow" />
            <Eyebrow className="mt-6">The Cosmos, Echoed Back</Eyebrow>
            <h1 className="heading-serif mt-4 text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              The universe has already
              <br />
              <span className="text-primary italic">written your story.</span>
            </h1>
            <p className="mt-5 max-w-md mx-auto text-sm leading-relaxed text-foreground-muted text-balance">
              Meet Jehana — your astrological guide. Real natal charts, AI-powered
              readings, grounded in classical wisdom. Not predictions. Reflections of
              who you already are.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {/* Guided Reading — linear, Jehana drives */}
            <div className="card card-hover cursor-pointer p-6" onClick={() => setStage("guided-onboard")}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-semibold text-foreground">Guided Reading</h3>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Free · Guided</span>
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Don&apos;t know what to ask? Jehana reads your chart and guides you
                    through it — one question at a time. She asks, you answer, she
                    reflects. No chat pressure, just a slow reading.
                  </p>
                  {hasSavedBirthData && (
                    <p className="mt-2 text-xs font-medium text-primary">
                      <Sparkles className="inline h-3 w-3" /> Welcome back — your chart is saved.
                    </p>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-foreground-subtle mt-1" />
              </div>
            </div>

            {/* Deep Echo — full chart chat */}
            <div className="card card-hover cursor-pointer p-6" onClick={() => setStage("deep-onboard")}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-semibold text-foreground">Deep Echo Chat</h3>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">3 Free Questions</span>
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Enter your birth details. Jehana reads your full chart and you ask
                    anything — Sun, Moon, houses, transits, relationships.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-foreground-subtle mt-1" />
              </div>
            </div>

            {/* Echo — sun sign only */}
            <div className="card card-hover cursor-pointer p-6" onClick={() => setStage("echo-pick")}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-semibold text-foreground">Echo Chat</h3>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Free · Unlimited</span>
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Pick your zodiac sign and start chatting. No birth date needed —
                    general guidance based on your sun sign.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-foreground-subtle mt-1" />
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-foreground-subtle">
            Your birth data is sacred. The cosmos gave it — we protect it.
          </p>
        </div>
      </div>
    );
  }

  // ECHO PICK STAGE
  if (stage === "echo-pick") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="text-center">
          <Eyebrow>Echo Chat · Free</Eyebrow>
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
                onClick={() => startEchoChat(sign.id)}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 transition-all hover:border-primary-light hover:bg-surface-muted"
              >
                <span className="text-2xl" style={{ color: elementColors[sign.element] }}>{sign.glyph}</span>
                <span className="text-xs font-medium">{sign.name}</span>
              </button>
            ))}
          </div>
        </Card>
        <button onClick={() => setStage("welcome")} className="btn-ghost mt-4 text-xs">
          ← Back
        </button>
      </div>
    );
  }

  // DEEP ONBOARD STAGE
  if (stage === "deep-onboard") {
    return (
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-12">
        {loading && (
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]"
            style={{ width: "900px", height: "900px" }}
          >
            <ZodiacWheel size={900} className="text-primary" />
          </div>
        )}

        <div className="relative z-10 w-full max-w-xl">
          {loading ? (
            <div className="fade-in flex flex-col items-center justify-center py-20">
              <ZodiacWheel size={72} className="text-primary spin-slow mb-8" />
              <p className="text-sm font-medium text-primary">{loadingHint || "The cosmos is aligning..."}</p>
            </div>
          ) : (
            <div className="fade-in text-center">
              <ZodiacWheel size={72} className="mx-auto text-primary spin-slow" />
              <Eyebrow className="mt-4">Deep Echo Chat · 3 Free Questions</Eyebrow>
              <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground">
                Enter your birth details.
              </h1>
              <p className="mt-3 text-sm text-foreground-muted">
                Jehana reads your chart and starts a conversation — about your strengths,
                your challenges, and what makes you uniquely you.
              </p>

              <Card className="mt-8 p-6 text-left">
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
                      <Clock className="h-4 w-4 text-primary" /> Birth Time
                      <span className="text-xs text-foreground-subtle">(deepens the reading — Moon & Rising need it)</span>
                    </label>
                    <input
                      type="time"
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground-muted">
                      <MapPin className="inline h-4 w-4 mr-1.5 text-primary" /> Birth Location
                    </label>
                    <GeoSearch
                      value={birthPlace}
                      placeholder="Search for your birth city..."
                      onSelect={(result) => {
                        setBirthPlace(result.name);
                        setBirthLat(result.lat);
                        setBirthLng(result.lng);
                      }}
                    />
                  </div>
                  {error && <p className="text-sm text-error">{error}</p>}
                  <button onClick={startDeepEcho} disabled={!birthDate || birthLat === undefined || loading} className="btn-primary w-full disabled:opacity-50">
                    <Sparkles className="h-4 w-4" />
                    Meet Jehana — Free
                  </button>
                </div>
              </Card>
              <p className="mt-4 text-center text-xs text-foreground-subtle">
                Your birth data is sacred. The cosmos gave it — we protect it.
              </p>
              <button onClick={() => setStage("welcome")} className="btn-ghost mt-4 text-xs">
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // GUIDED ONBOARD STAGE — linear, Jehana drives (from old /echo)
  if (stage === "guided-onboard") {
    // Sub-stages within guided: input → loading → intro → hook-answer → hook-response → done
    if (loading) {
      return (
        <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
          <div className="fade-in flex flex-col items-center justify-center py-20">
            <ZodiacWheel size={72} className="text-primary spin-slow mb-8" />
            <p className="text-sm font-medium text-primary">{loadingHint || "The cosmos is aligning..."}</p>
            <p className="mt-2 text-xs text-foreground-subtle">Jehana is listening to your chart</p>
          </div>
        </div>
      );
    }

    // Not started yet — show birth data form
    if (!guidedIntro) {
      const handleGuidedStart = async () => {
        if (!birthDate || birthLat === undefined || birthLng === undefined) {
          setError("Please enter your birth date and birth location.");
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const city = { lat: birthLat, lng: birthLng, name: birthPlace };
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
          setGuidedChart(data.chart);
          setGuidedIntro(data.intro);
          setGuidedHookIdx(0);
          const sign = getSignById(data.chart.sun.sign.toLowerCase());
          setSelectedSign(sign?.id || "aries");
          // Save birth data
          await saveBirthData({ birthDate, birthTime: birthTime || undefined, birthPlace, birthLat, birthLng, zodiacSign: sign?.id });
          if (!birthTime) setShowAddTime(true);
        } catch {
          setError("Jehana couldn't connect. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="mx-auto max-w-xl px-4 py-12">
          <div className="text-center">
            <ZodiacWheel size={72} className="mx-auto text-primary spin-slow" />
            <Eyebrow className="mt-4">Guided Reading · Free</Eyebrow>
            <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground">
              Let Jehana guide you.
            </h1>
            <p className="mt-3 text-sm text-foreground-muted">
              Enter your birth details. Jehana reads your chart, introduces herself,
              and asks you questions — one at a time. No pressure, just a slow reading.
            </p>
          </div>

          <Card className="mt-8 p-6 text-left">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                  <Calendar className="h-4 w-4 text-primary" /> Birth Date
                </label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().split("T")[0]} min="1900-01-01" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                  <Clock className="h-4 w-4 text-primary" /> Birth Time
                  <span className="text-xs text-foreground-subtle">(deepens the reading)</span>
                </label>
                <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground-muted">
                  <MapPin className="inline h-4 w-4 mr-1.5 text-primary" /> Birth Location
                </label>
                <GeoSearch value={birthPlace} placeholder="Search for your birth city..." onSelect={(r) => { setBirthPlace(r.name); setBirthLat(r.lat); setBirthLng(r.lng); }} />
              </div>
              {error && <p className="text-sm text-error">{error}</p>}
              <button onClick={handleGuidedStart} disabled={!birthDate || birthLat === undefined || loading} className="btn-primary w-full disabled:opacity-50">
                <Sparkles className="h-4 w-4" /> Begin Your Reading
              </button>
            </div>
          </Card>
          <p className="mt-4 text-center text-xs text-foreground-subtle">Your birth data is sacred. The cosmos gave it — we protect it.</p>
          <button onClick={() => setStage("welcome")} className="btn-ghost mt-4 text-xs">← Back</button>
        </div>
      );
    }

    // Chart reveal + intro
    if (guidedIntro && guidedHookIdx === 0 && !guidedResponse && !guidedUserAnswer) {
      return (
        <div className="relative mx-auto max-w-xl px-4 py-12">
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]"
            style={{ width: "700px", height: "700px" }}
          >
            <ZodiacWheel size={700} className="text-primary" />
          </div>
          <div className="relative z-10 fade-in">
            {guidedChart && (
              <div className="mb-6">
                <ChartReveal
                  chart={guidedChart}
                  onAddTime={() => {
                    setShowAddTime(false);
                    setStage("deep-onboard");
                  }}
                  onContinueWithoutTime={() => {}}
                />
              </div>
            )}

            {/* Jehana's intro — streaming token-by-token */}
            <StreamedIntro
              greeting={guidedIntro.greeting}
              personalitySummary={guidedIntro.personalitySummary}
              followUp={guidedIntro.followUp}
            />

            {/* Start hooks button */}
            <button onClick={() => setGuidedHookIdx(1)} className="btn-primary w-full">
              <Sparkles className="h-4 w-4" /> Begin the Questions
            </button>
          </div>
        </div>
      );
    }

    // Hook question — user types answer
    if (guidedIntro && guidedHookIdx > 0 && guidedHookIdx <= guidedIntro.hookQuestions.length && !guidedResponse) {
      const hook = guidedIntro.hookQuestions[guidedHookIdx - 1];
      const handleGuidedHookSubmit = async () => {
        if (!guidedUserAnswer.trim() || !hook) return;
        setGuidedLoading(true);
        setError(null);
        try {
          const response = await fetch("/api/echo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "hook-response",
              birthDate,
              birthTime: birthTime || undefined,
              lat: birthLat,
              lng: birthLng,
              hookQuestion: hook,
              userAnswer: guidedUserAnswer,
            }),
          });
          if (!response.ok) throw new Error("Failed");
          const data = await response.json();
          setGuidedResponse(data.response);
        } catch {
          setError("Jehana couldn't respond. Please try again.");
        } finally {
          setGuidedLoading(false);
        }
      };

      return (
        <div className="mx-auto max-w-xl px-4 py-12">
          <div className="fade-in">
            <div className="mb-6 rounded-lg bg-surface-muted p-5">
              <p className="text-sm font-medium text-primary">{hook?.question}</p>
              {hook?.chartBasis && <p className="mt-1 text-xs text-foreground-subtle italic">Based on: {hook.chartBasis}</p>}
              {hook?.responseHint && <p className="mt-1 text-xs text-foreground-subtle">{hook.responseHint}</p>}
            </div>
            <div>
              <textarea
                value={guidedUserAnswer}
                onChange={(e) => setGuidedUserAnswer(e.target.value)}
                placeholder="Share your thoughts... there's no wrong answer."
                rows={4}
                className="input-field"
                autoFocus
              />
              <button onClick={handleGuidedHookSubmit} disabled={!guidedUserAnswer.trim() || guidedLoading} className="btn-primary mt-3 w-full disabled:opacity-50">
                {guidedLoading ? <><Clock className="h-4 w-4 animate-spin" /> The universe is echoing back...</> : <><Sparkles className="h-4 w-4" /> Share with Jehana</>}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-error">{error}</p>}
            <p className="mt-4 text-center text-xs text-foreground-subtle">
              Question {guidedHookIdx} of {guidedIntro.hookQuestions.length}
            </p>
          </div>
        </div>
      );
    }

    // Hook response — show Jehana's answer, then next or finish
    if (guidedResponse) {
      const isLastHook = guidedHookIdx >= guidedIntro!.hookQuestions.length;
      const handleNext = () => {
        if (isLastHook) {
          // Transition to chat — convert guided experience to chat messages
          setIsPersonalized(true);
          setExchangeCount(guidedIntro!.hookQuestions.length);
          setMessages([
            { role: "assistant", content: guidedIntro!.greeting },
            { role: "assistant", content: guidedIntro!.personalitySummary },
            ...guidedIntro!.hookQuestions.map((h) => ({ role: "assistant" as const, content: `${h.question} (Based on: ${h.chartBasis})` })),
            { role: "assistant", content: "I've read the first pages of your chart. Ask me anything — or let the conversation go wherever it wants to go." },
          ]);
          setStage("chat");
        } else {
          setGuidedResponse(null);
          setGuidedUserAnswer("");
          setGuidedHookIdx((i) => i + 1);
        }
      };

      return (
        <div className="mx-auto max-w-xl px-4 py-12">
          <div className="fade-in">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 rounded-lg bg-surface-muted p-5">
                <p className="text-sm leading-relaxed text-foreground-muted whitespace-pre-wrap">{guidedResponse}</p>
              </div>
            </div>
            <button onClick={handleNext} className="btn-primary w-full">
              {isLastHook ? <><BookOpen className="h-4 w-4" /> Continue to free chat →</> : <><Sparkles className="h-4 w-4" /> Next question</>}
            </button>
            {!isLastHook && (
              <p className="mt-4 text-center text-xs text-foreground-subtle">
                {guidedIntro!.hookQuestions.length - guidedHookIdx} questions remaining
              </p>
            )}
          </div>
        </div>
      );
    }
  }

  // CHAT STAGE
  const remaining = isPremium ? Infinity : freeLimit - freeUsed;
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
              {isPersonalized ? " · Deep Echo" : " · Echo Chat"}
              {isPersonalized && !isPremium && ` · ${remaining} free left`}
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
            setStage("welcome");
          }}
          className="btn-ghost text-xs"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => {
            if (msg.isHook) return null;
            return (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm", msg.role === "user" ? "bg-primary text-surface" : "bg-primary/10 text-primary")}>
                  {msg.role === "user" ? "You" : "✦"}
                </div>
                <div className="max-w-[85%]">
                  <div className={cn("rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap", msg.role === "user" ? "bg-primary text-surface" : "bg-surface-muted text-foreground")}>
                    {msg.content || (streaming ? "..." : "")}
                  </div>
                  {msg.role === "assistant" && msg.content && (msg.sources && msg.sources.length > 0 || msg.rag) && (
                    <SourcesPanel sources={msg.sources || []} rag={msg.rag} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Hook question buttons */}
          {messages.some((m) => m.isHook) && !streaming && !showUpgrade && (
            <div className="flex flex-col gap-2 pl-11">
              <p className="mb-1 text-center text-xs uppercase tracking-[0.125em] text-foreground-subtle">
                Your chart makes me curious — pick one, or ask anything:
              </p>
              {hookQuestions.map((hook) => (
                <button
                  key={hook.id}
                  onClick={() => {
                    setMessages((prev) => prev.filter((m) => !m.isHook));
                    sendMessage(HOOK_QUESTIONS[hook.id] || hook.question || "Tell me more");
                  }}
                  className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-left text-sm text-foreground-muted transition-all hover:border-primary hover:bg-primary/10"
                >
                  <span className="font-medium text-primary">?</span> {HOOK_QUESTIONS[hook.id] || hook.question}
                  {hook.chartBasis && (
                    <span className="ml-2 text-xs text-foreground-subtle italic">({hook.chartBasis})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Echo suggestions */}
          {messages.length === 1 && !isPersonalized && !streaming && (
            <div className="flex flex-col gap-2 pl-11">
              {PER_SIGN_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-left text-sm text-foreground-muted transition-all hover:border-primary hover:bg-primary/10"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Upgrade prompt (modal sheet trigger — Phase C will replace with sheet) */}
          {showUpgrade && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  You&apos;ve used your {freeLimit} free questions. Unlock unlimited Deep Echo Chat.
                </p>
              </div>
              <a href="/pricing" className="btn-primary mt-3 text-sm">
                <Crown className="h-3.5 w-3.5" /> Unlock Deep Echo — £5.99/month
              </a>
              <button
                onClick={() => {
                  setShowUpgrade(false);
                  setIsPersonalized(false);
                  setMessages([{ role: "assistant", content: `Let's keep chatting in Echo mode. You're a ${getSignById(selectedSign)?.name} — ask me anything about your sign!` }]);
                }}
                className="btn-ghost mt-2 text-xs"
              >
                Or keep chatting in Echo mode →
              </button>
            </div>
          )}

          {/* Add birth time prompt */}
          {showAddTime && !streaming && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
              <p className="text-xs text-foreground-muted">
                Your Moon and Rising are approximate without birth time.{" "}
                <button
                  onClick={() => {
                    setShowAddTime(false);
                    setStage("deep-onboard");
                  }}
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  Add your birth time →
                </button>
              </p>
            </div>
          )}

          {chatError && (
            <div className="flex items-center gap-2 rounded-lg bg-error-light px-4 py-3 text-sm text-error">
              <AlertCircle className="h-4 w-4" />
              {chatError}
              <button onClick={() => sendMessage(input)} className="ml-auto text-xs font-medium text-primary hover:text-primary-hover">
                Retry
              </button>
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
          placeholder={showUpgrade ? "Unlock Deep Echo to continue..." : "Ask Jehana anything..."}
          className="input-field flex-1"
          disabled={streaming || showUpgrade}
          enterKeyHint="send"
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

function SourcesPanel({ sources, rag }: { sources: Source[]; rag?: RagMeta }) {
  const [open, setOpen] = useState(false);

  const methodLabel = rag?.method === "vector" ? "Semantic search" : rag?.method === "keyword" ? "Keyword match" : "No search";
  const methodColor = rag?.method === "vector" ? "text-success" : rag?.method === "keyword" ? "text-warning" : "text-foreground-subtle";
  const topScorePct = rag?.topScore !== null && rag?.topScore !== undefined ? `${(rag.topScore * 100).toFixed(0)}% match` : null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-surface/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs text-foreground-muted transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">Sourced from the book</span>
          {sources.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{sources.length} passages</span>
          )}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {rag && (
            <div className="flex flex-wrap gap-2 rounded-md bg-surface-muted/40 px-2 py-1.5 text-[10px]">
              <span className={`font-medium ${methodColor}`}>{methodLabel}</span>
              {topScorePct && <span className="text-foreground-muted">· Top: <span className="font-medium text-foreground">{topScorePct}</span></span>}
              {rag.queryDims && <span className="text-foreground-muted">· {rag.queryDims}-dim vectors</span>}
              {rag.bookChunks > 0 && <span className="text-foreground-muted">· {rag.bookChunks} passages searched</span>}
            </div>
          )}
          {sources.map((source, idx) => (
            <div key={idx} className="rounded-md bg-surface-muted/60 p-3">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.125em] text-primary">
                Chapter {source.chapter_num}: {source.chapter_title}
                {source.score !== undefined && <span className="ml-2 text-foreground-subtle">{(source.score * 100).toFixed(0)}% match</span>}
              </p>
              <p className="text-xs leading-relaxed text-foreground-muted line-clamp-4">&ldquo;{source.text}&rdquo;</p>
            </div>
          ))}
          {sources.length === 0 && rag && (
            <p className="text-xs text-foreground-muted italic py-2">No book passages retrieved. Jehana responded from general knowledge.</p>
          )}
          {sources.length > 0 && (
            <p className="pt-1 text-[10px] text-foreground-subtle">
              From &ldquo;Astrology: Its Technics and Ethics&rdquo; by C.A.Q. Libra (1917). Retrieved via {methodLabel.toLowerCase()} over {rag?.embeddedChunks || 1444} embedded passages.
            </p>
          )}
        </div>
      )}
    </div>
  );
}