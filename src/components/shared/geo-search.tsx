"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Loader2, Globe, ChevronDown } from "lucide-react";

type GeoResult = {
  name: string;
  lat: number;
  lng: number;
  country?: string;
};

/**
 * Curated birth cities — always available, zero network dependency.
 * Order: major European cities first (primary market), then MENA (Issa's region).
 */
const BIRTH_CITIES: GeoResult[] = [
  // Europe (pilot market)
  { name: "London, UK", lat: 51.5074, lng: -0.1278, country: "United Kingdom" },
  { name: "Manchester, UK", lat: 53.4808, lng: -2.2426, country: "United Kingdom" },
  { name: "Birmingham, UK", lat: 52.4862, lng: -1.8904, country: "United Kingdom" },
  { name: "Glasgow, UK", lat: 55.8642, lng: -4.2518, country: "United Kingdom" },
  { name: "Dublin, Ireland", lat: 53.3498, lng: -6.2603, country: "Ireland" },
  { name: "Paris, France", lat: 48.8566, lng: 2.3522, country: "France" },
  { name: "Lyon, France", lat: 45.764, lng: 4.8357, country: "France" },
  { name: "Marseille, France", lat: 43.2965, lng: 5.3698, country: "France" },
  { name: "Berlin, Germany", lat: 52.52, lng: 13.405, country: "Germany" },
  { name: "Munich, Germany", lat: 48.1351, lng: 11.582, country: "Germany" },
  { name: "Frankfurt, Germany", lat: 50.1109, lng: 8.6821, country: "Germany" },
  { name: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041, country: "Netherlands" },
  { name: "Rotterdam, Netherlands", lat: 51.9244, lng: 4.4777, country: "Netherlands" },
  { name: "Brussels, Belgium", lat: 50.8503, lng: 4.3517, country: "Belgium" },
  { name: "Zurich, Switzerland", lat: 47.3769, lng: 8.5417, country: "Switzerland" },
  { name: "Geneva, Switzerland", lat: 46.2044, lng: 6.1432, country: "Switzerland" },
  { name: "Vienna, Austria", lat: 48.2082, lng: 16.3738, country: "Austria" },
  { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038, country: "Spain" },
  { name: "Barcelona, Spain", lat: 41.3874, lng: 2.1686, country: "Spain" },
  { name: "Lisbon, Portugal", lat: 38.7223, lng: -9.1393, country: "Portugal" },
  { name: "Rome, Italy", lat: 41.9028, lng: 12.4964, country: "Italy" },
  { name: "Milan, Italy", lat: 45.4642, lng: 9.19, country: "Italy" },
  { name: "Naples, Italy", lat: 40.8518, lng: 14.2681, country: "Italy" },
  { name: "Athens, Greece", lat: 37.9838, lng: 23.7275, country: "Greece" },
  { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686, country: "Sweden" },
  { name: "Oslo, Norway", lat: 59.9139, lng: 10.7522, country: "Norway" },
  { name: "Copenhagen, Denmark", lat: 55.6761, lng: 12.5683, country: "Denmark" },
  { name: "Helsinki, Finland", lat: 60.1699, lng: 24.9384, country: "Finland" },
  { name: "Warsaw, Poland", lat: 52.2297, lng: 21.0122, country: "Poland" },
  { name: "Prague, Czechia", lat: 50.0755, lng: 14.4378, country: "Czechia" },
  { name: "Budapest, Hungary", lat: 47.4979, lng: 19.0402, country: "Hungary" },
  { name: "Istanbul, Turkey", lat: 41.0082, lng: 28.9784, country: "Turkey" },
  // MENA
  { name: "Amman, Jordan", lat: 31.9539, lng: 35.9108, country: "Jordan" },
  { name: "Zarqa, Jordan", lat: 32.0728, lng: 36.0881, country: "Jordan" },
  { name: "Irbid, Jordan", lat: 32.5556, lng: 35.85, country: "Jordan" },
  { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708, country: "UAE" },
  { name: "Abu Dhabi, UAE", lat: 24.4539, lng: 54.3773, country: "UAE" },
  { name: "Riyadh, Saudi Arabia", lat: 24.7136, lng: 46.6753, country: "Saudi Arabia" },
  { name: "Jeddah, Saudi Arabia", lat: 21.4858, lng: 39.1925, country: "Saudi Arabia" },
  { name: "Mecca, Saudi Arabia", lat: 21.3891, lng: 39.8579, country: "Saudi Arabia" },
  { name: "Medina, Saudi Arabia", lat: 24.5247, lng: 39.5692, country: "Saudi Arabia" },
  { name: "Dammam, Saudi Arabia", lat: 26.4207, lng: 50.0888, country: "Saudi Arabia" },
  { name: "Doha, Qatar", lat: 25.2854, lng: 51.531, country: "Qatar" },
  { name: "Kuwait City, Kuwait", lat: 29.3759, lng: 47.9774, country: "Kuwait" },
  { name: "Beirut, Lebanon", lat: 33.8938, lng: 35.5018, country: "Lebanon" },
  { name: "Cairo, Egypt", lat: 30.0444, lng: 30.2564, country: "Egypt" },
  { name: "Casablanca, Morocco", lat: 33.5731, lng: -7.5898, country: "Morocco" },
  { name: "Tunis, Tunisia", lat: 36.8065, lng: 10.1815, country: "Tunisia" },
  // North America (English-speaking diaspora)
  { name: "New York, USA", lat: 40.7128, lng: -74.006, country: "USA" },
  { name: "Chicago, USA", lat: 41.8781, lng: -87.6298, country: "USA" },
  { name: "Los Angeles, USA", lat: 34.0522, lng: -118.2437, country: "USA" },
  { name: "Toronto, Canada", lat: 43.6532, lng: -79.3832, country: "Canada" },
  { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093, country: "Australia" },
];

function searchLocal(query: string): GeoResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return BIRTH_CITIES.slice(0, 8);
  return BIRTH_CITIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
}

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
  const [remoteFailed, setRemoteFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localResults = useMemo(() => searchLocal(query), [query]);

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

    // 1) LOCAL LIST ALWAYS SHOWS — instant, reliable, no network needed
    setResults(localResults);
    setOpen(true);
    setHighlightIdx(-1);

    // 2) Remote search as best-effort enrichment (only if local didn't match well)
    if (localResults.length >= 4) {
      setRemoteFailed(false);
      return;
    }

    const doSearch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("geocode failed");
        const data = await res.json();
        const remote = (data.results || []) as GeoResult[];
        // merge: local first, then remote results not already listed
        const seen = new Set(localResults.map((r) => r.name));
        const merged = [...localResults, ...remote.filter((r) => !seen.has(r.name))].slice(0, 10);
        setResults(merged);
        setRemoteFailed(false);
      } catch {
        setRemoteFailed(true);
        // keep localResults — already set
      } finally {
        setLoading(false);
      }
    };

    debounceRef.current = setTimeout(doSearch, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, localResults]);

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
        <button
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              setResults(query.trim().length < 2 ? BIRTH_CITIES.slice(0, 8) : searchLocal(query));
              setOpen(true);
            }
          }}
          aria-label="Show popular birth cities"
          className="shrink-0 rounded-md p-2 text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {loading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-foreground-subtle" />
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-soft">
          {results.map((result, i) => (
            <button
              key={`${result.lat}-${result.lng}-${i}`}
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
          {remoteFailed && (
            <p className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-xs text-foreground-subtle">
              <Globe className="h-3 w-3" />
              Online search unavailable — showing popular cities
            </p>
          )}
        </div>
      )}
      {open && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground-muted shadow-soft">
          {remoteFailed ? "No match found — check the spelling or pick a popular city." : "Searching…"}
        </div>
      )}
    </div>
  );
}