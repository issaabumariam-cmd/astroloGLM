import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function SectionHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("section-header", className)}>{children}</h2>;
}

export function Card({ children, className, hover }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn("card", hover && "card-hover", className)}>{children}</div>;
}

export function OrnateDivider({ className }: { className?: string }) {
  return (
    <div className={cn("divider-ornate py-4", className)}>
      <span className="text-lg">✦</span>
    </div>
  );
}

export function ScoreBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 75 ? "var(--color-success)" : score >= 55 ? "var(--color-warning)" : "var(--color-error)";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground-muted">{label}</span>
        <span className="text-sm font-semibold text-foreground">{score}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted",
        className
      )}
    >
      {children}
    </span>
  );
}