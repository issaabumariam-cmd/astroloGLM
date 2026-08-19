"use client";

import { useState } from "react";
import { zodiacSigns, elementColors } from "@/lib/astrology/signs";
import { calculateCompatibility, type CompatibilityResult } from "@/lib/astrology/compatibility";
import { Eyebrow, Card, ScoreBar, OrnateDivider } from "@/components/shared/ui-primitives";
import { ShareButton } from "@/components/shared/share-button";
import { Sparkles, Heart, Users, Repeat, Loader2, BookOpen, Lock } from "lucide-react";

export default function CompatibilityPage() {
  const [sign1, setSign1] = useState<string>("aries");
  const [sign2, setSign2] = useState<string>("libra");
  const [result, setResult] = useState<CompatibilityResult | null>(
    calculateCompatibility("aries", "libra")
  );
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSources, setAiSources] = useState<{ chapter_num: number; chapter_title: string; text: string; score?: number }[]>([]);

  const handleCheck = (s1: string, s2: string) => {
    setSign1(s1);
    setSign2(s2);
    setResult(calculateCompatibility(s1, s2));
  };

  const swap = () => handleCheck(sign2, sign1);

  const fetchAIReading = async () => {
    setAiLoading(true);
    setAiReading(null);
    try {
      const response = await fetch("/api/compatibility-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sign1, sign2 }),
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setAiReading(data.reading);
      setAiSources(data.sources || []);
    } catch {
      setAiReading("Could not generate reading. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 text-center">
        <Eyebrow>Relationship Dynamics</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          Compatibility
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          How do your signs interact? Explore love, communication, trust, and emotional resonance.
        </p>
      </div>

      {/* Sign Pickers */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* Sign 1 */}
          <SignPicker
            label="Your Sign"
            selected={sign1}
            onSelect={(s) => handleCheck(s, sign2)}
          />
          {/* Swap button */}
          <button
            onClick={swap}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface text-foreground-muted transition-colors hover:bg-surface-muted hover:text-primary"
            aria-label="Swap signs"
          >
            <Repeat className="h-4 w-4" />
          </button>
          {/* Sign 2 */}
          <SignPicker
            label="Partner's Sign"
            selected={sign2}
            onSelect={(s) => handleCheck(sign1, s)}
          />
        </div>
      </Card>

      {result && (
        <>
          <OrnateDivider className="my-8" />

          {/* Overall Score */}
          <div className="mb-8 text-center">
            <div className="inline-flex flex-col items-center">
              <span className="text-7xl font-serif font-semibold text-primary">
                {result.overallScore}
              </span>
              <span className="text-xs uppercase tracking-wider text-foreground-subtle">Overall Match</span>
            </div>
          </div>

          {/* Scores */}
          <Card className="mb-6 p-6">
            <div className="space-y-5">
              <ScoreBar score={result.loveScore} label="Love & Romance" />
              <ScoreBar score={result.communicationScore} label="Communication" />
              <ScoreBar score={result.trustScore} label="Trust & Stability" />
              <ScoreBar score={result.emotionScore} label="Emotional Resonance" />
            </div>
          </Card>

          {/* Summary */}
          <Card className="mb-6 p-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Eyebrow>The Dynamic</Eyebrow>
            </div>
            <p className="text-base leading-relaxed text-foreground-muted">{result.summary}</p>
            <p className="mt-3 text-sm font-medium text-primary">{result.elementMatch}</p>
          </Card>

          {/* Strengths & Challenges */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2 text-success">
                <Heart className="h-5 w-5" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">Strengths</h3>
              </div>
              <ul className="space-y-2.5">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                    <span className="mt-1 text-success">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2 text-warning">
                <Users className="h-5 w-5" />
                <h3 className="text-sm font-semibold uppercase tracking-wide">Growth Areas</h3>
              </div>
              <ul className="space-y-2.5">
                {result.challenges.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground-muted">
                    <span className="mt-1 text-warning">!</span>
                    {c}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Pair Header */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl" style={{ color: elementColors[result.sign1.element] }}>
                {result.sign1.glyph}
              </span>
              <span className="text-2xl text-primary">+</span>
              <span className="text-4xl" style={{ color: elementColors[result.sign2.element] }}>
                {result.sign2.glyph}
              </span>
            </div>
            <p className="mt-2 font-serif text-xl font-semibold text-foreground">
              {result.sign1.name} & {result.sign2.name}
            </p>
            <div className="mt-3 flex justify-center">
              <ShareButton
                title={`${result.sign1.name} & ${result.sign2.name} Compatibility — ${result.overallScore}%`}
                text={`${result.sign1.name} and ${result.sign2.name} have a ${result.overallScore}% compatibility match on Astrolo!`}
              />
            </div>
          </div>

          {/* AI Deep Reading */}
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">AI Deep Reading</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Premium</span>
            </div>
            <p className="mt-2 text-xs text-foreground-subtle">
              Echo reads the synastry chapter and interprets your connection through classical wisdom.
            </p>
            {aiReading ? (
              <div className="mt-4">
                <p className="text-sm leading-relaxed text-foreground-muted whitespace-pre-wrap">{aiReading}</p>
                {aiSources.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="flex items-center gap-1 text-xs font-medium text-primary">
                      <BookOpen className="h-3 w-3" /> Sourced from the book ({aiSources.length} passages)
                    </p>
                    <div className="mt-2 space-y-1">
                      {aiSources.map((s, i) => (
                        <p key={i} className="text-[10px] text-foreground-subtle">
                          Ch.{s.chapter_num}: {s.chapter_title} · {Math.round((s.score || 0) * 100)}% match
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={fetchAIReading} className="btn-ghost mt-3 text-xs">
                  <Repeat className="h-3 w-3" /> Regenerate
                </button>
              </div>
            ) : aiLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Echo is reading your synastry...
              </div>
            ) : (
              <button onClick={fetchAIReading} className="btn-primary mt-4 text-sm">
                <Sparkles className="h-3.5 w-3.5" /> Generate Deep Reading
              </button>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function SignPicker({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: string;
  onSelect: (signId: string) => void;
}) {
  const sign = zodiacSigns.find((s) => s.id === selected)!;
  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-xs uppercase tracking-wider text-foreground-subtle">{label}</label>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="appearance-none rounded-lg border border-border-strong bg-surface py-3 pl-4 pr-10 text-sm font-medium text-foreground cursor-pointer focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        >
          {zodiacSigns.map((s) => (
            <option key={s.id} value={s.id}>
              {s.glyph} {s.name} ({s.dates})
            </option>
          ))}
        </select>
      </div>
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
        style={{ background: `${elementColors[sign.element]}15` }}
      >
        {sign.glyph}
      </div>
      <p className="text-xs font-medium text-foreground">{sign.name}</p>
      <p className="text-[10px] text-foreground-subtle">{sign.element} · {sign.modality}</p>
    </div>
  );
}