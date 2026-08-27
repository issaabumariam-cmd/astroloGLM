"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";

type GeoResult = {
  name: string;
  lat: number;
  lng: number;
  country?: string;
};

export function GeoSearch({
  value,
  onSelect,
  placeholder = "Search for your birth city...",
}: {
  value?: string;
  onSelect: (result: GeoResult) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setOpen(false);
      return;
    }

    const doSearch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
        setHighlightIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    debounceRef.current = setTimeout(doSearch, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (result: GeoResult) => {
    setQuery(result.name);
    setOpen(false);
    onSelect(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-field"
          autoComplete="off"
          aria-label="Birth location search"
        />
      </div>
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-foreground-subtle" />
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
          {results.map((result, i) => (
            <button
              key={`${result.lat}-${result.lng}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setHighlightIdx(i)}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                i === highlightIdx ? "bg-surface-muted text-foreground" : "text-foreground-muted hover:bg-surface-muted"
              }`}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">{result.name}</span>
              {result.country && (
                <span className="ml-auto shrink-0 text-xs text-foreground-subtle">{result.country}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}