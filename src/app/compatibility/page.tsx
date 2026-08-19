"use client";

import { useState } from "react";
import { zodiacSigns, elementColors } from "@/lib/astrology/signs";
import { calculateCompatibility, type CompatibilityResult } from "@/lib/astrology/compatibility";
import { Eyebrow, Card, ScoreBar, OrnateDivider } from "@/components/shared/ui-primitives";
import { ShareButton } from "@/components/shared/share-button";
import { Sparkles, Heart, Users, Repeat } from "lucide-react";

export default function CompatibilityPage() {
  const [sign1, setSign1] = useState<string>("aries");
  const [sign2, setSign2] = useState<string>("libra");
  const [result, setResult] = useState<CompatibilityResult | null>(
    calculateCompatibility("aries", "libra")
  );

  const handleCheck = (s1: string, s2: string) => {
    setSign1(s1);
    setSign2(s2);
    setResult(calculateCompatibility(s1, s2));
  };

  const swap = () => handleCheck(sign2, sign1);

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