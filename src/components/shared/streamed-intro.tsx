"use client";

import { Sparkles } from "lucide-react";
import { useStreamText } from "./stream-text";

export function StreamedIntro({
  greeting,
  personalitySummary,
  followUp,
}: {
  greeting: string;
  personalitySummary: string;
  followUp: string;
}) {
  const fullText = greeting + "\n\n" + personalitySummary;
  const { displayed, done } = useStreamText(fullText, true, 15);

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 rounded-lg bg-surface-muted p-5">
          <p className="text-base font-medium text-foreground whitespace-pre-wrap">
            {displayed}
            {!done && <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />}
          </p>
          {done && (
            <p className="mt-4 text-sm font-medium text-primary fade-in">{followUp}</p>
          )}
        </div>
      </div>
    </div>
  );
}