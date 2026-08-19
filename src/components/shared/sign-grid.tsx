import { zodiacSigns } from "@/lib/astrology/signs";
import { cn } from "@/lib/utils";

export function SignGrid({
  onSelect,
  selected,
  className,
  size = "md",
}: {
  onSelect?: (signId: string) => void;
  selected?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-xs gap-1 p-2",
    md: "text-sm gap-1.5 p-3",
    lg: "text-base gap-2 p-4",
  };

  const glyphSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={cn("grid grid-cols-4 gap-2 sm:grid-cols-6", className)}>
      {zodiacSigns.map((sign) => (
        <button
          key={sign.id}
          onClick={() => onSelect?.(sign.id)}
          className={cn(
            "flex flex-col items-center rounded-lg border transition-all",
            sizeClasses[size],
            selected === sign.id
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-surface text-foreground-muted hover:border-primary-light hover:bg-surface-muted"
          )}
        >
          <span className={cn(glyphSizes[size], "mb-1")}>{sign.glyph}</span>
          <span className="font-medium">{sign.name}</span>
          {size !== "sm" && (
            <span className="text-[10px] text-foreground-subtle">{sign.dates.split(" – ")[0]}</span>
          )}
        </button>
      ))}
    </div>
  );
}