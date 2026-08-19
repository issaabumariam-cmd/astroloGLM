"use client";

import { useState, useEffect } from "react";
import { BookOpen, MessageSquare, Database, Settings, Loader2, Search, RefreshCw, Trash2 } from "lucide-react";
import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { cn } from "@/lib/utils";

type Tab = "overview" | "chunks" | "prompts" | "rag-test" | "cache";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "astrolo-admin-2026";

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setError(null);
    } else {
      setError("Incorrect password");
    }
  };

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12">
        <Card className="w-full p-6">
          <h1 className="heading-serif text-2xl font-semibold text-foreground">Admin Panel</h1>
          <p className="mt-1 text-sm text-foreground-muted">Enter password to access the dashboard.</p>
          <form onSubmit={handleAuth} className="mt-4 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="input-field"
              autoFocus
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <button type="submit" className="btn-primary w-full">Access Dashboard</button>
          </form>
        </Card>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: "overview", label: "Overview", icon: Settings },
    { id: "chunks", label: "Book Chunks", icon: BookOpen },
    { id: "prompts", label: "AI Prompts", icon: MessageSquare },
    { id: "rag-test", label: "RAG Test", icon: Search },
    { id: "cache", label: "Horoscope Cache", icon: Database },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-8">
        <Eyebrow>Admin Dashboard</Eyebrow>
        <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground">Astrolo Control Panel</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
              tab === t.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-surface text-foreground-muted hover:border-primary-light hover:bg-surface-muted"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "chunks" && <ChunksTab />}
      {tab === "prompts" && <PromptsTab />}
      {tab === "rag-test" && <RagTestTab />}
      {tab === "cache" && <CacheTab />}
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<{
    chunkCount: number;
    embeddedCount: number;
    hasBook: boolean;
    ollamaModel: string;
    ollamaUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { if (active) { setStats(data); setTimeout(() => setLoading(false), 0); } })
      .catch(() => { setTimeout(() => setLoading(false), 0); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="text-sm text-foreground-muted">Loading...</div>;
  if (!stats) return <div className="text-sm text-error">Could not load stats</div>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Book Knowledge Base</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-foreground-muted">Total chunks</dt><dd className="font-medium text-foreground">{stats.chunkCount}</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Embedded</dt><dd className="font-medium text-foreground">{stats.embeddedCount}</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Status</dt><dd className="font-medium text-success">{stats.hasBook ? "Active" : "Empty"}</dd></div>
        </dl>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">AI Configuration</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-foreground-muted">Model</dt><dd className="font-medium text-foreground">{stats.ollamaModel}</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">URL</dt><dd className="font-medium text-foreground text-xs">{stats.ollamaUrl}</dd></div>
        </dl>
      </Card>
    </div>
  );
}

function ChunksTab() {
  const [chunks, setChunks] = useState<{ chapter_num: number; chapter_title: string; chunk_index: number; text: string; embedding?: number[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/chunks")
      .then((r) => r.json())
      .then((data) => { if (active) { setChunks(data.chunks || []); setTimeout(() => setLoading(false), 0); } })
      .catch(() => { setTimeout(() => setLoading(false), 0); });
    return () => { active = false; };
  }, []);

  const filtered = chunks.filter((c) => {
    const matchSearch = !search || c.text.toLowerCase().includes(search.toLowerCase());
    const matchChapter = !chapterFilter || c.chapter_num === parseInt(chapterFilter);
    return matchSearch && matchChapter;
  });

  const chapters = [...new Set(chunks.map((c) => c.chapter_num))].sort((a, b) => a - b);

  if (loading) return <div className="text-sm text-foreground-muted">Loading chunks...</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search chunks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={chapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All chapters</option>
          {chapters.map((ch) => <option key={ch} value={ch}>Chapter {ch}</option>)}
        </select>
      </div>
      <p className="mb-3 text-sm text-foreground-muted">Showing {filtered.length} of {chunks.length} chunks</p>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filtered.slice(0, 100).map((c, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-center gap-2 text-xs text-foreground-subtle">
              <span className="font-medium text-primary">Ch.{c.chapter_num}</span>
              <span>{c.chapter_title}</span>
              <span>·</span>
              <span>Chunk {c.chunk_index}</span>
              {c.embedding && <span className="text-success">✓ embedded</span>}
            </div>
            <p className="mt-1 text-sm text-foreground-muted line-clamp-2">{c.text}</p>
          </Card>
        ))}
        {filtered.length > 100 && <p className="text-center text-xs text-foreground-subtle py-2">Showing first 100 results...</p>}
      </div>
    </div>
  );
}

function PromptsTab() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/prompts")
      .then((r) => r.json())
      .then((data) => { setSystemPrompt(data.systemPrompt || ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = () => {
    fetch("/api/admin/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt }),
    }).then(() => { setSaved(true); setTimeout(() => setSaved(false), 2000); });
  };

  if (loading) return <div className="text-sm text-foreground-muted">Loading prompts...</div>;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2">AI Advisor System Prompt</h3>
      <p className="text-xs text-foreground-muted mb-3">This prompt controls how the AI advisor behaves. Changes apply to all new conversations.</p>
      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={15}
        className="input-field font-mono text-xs"
      />
      <button onClick={handleSave} className="btn-primary mt-3">
        {saved ? "Saved!" : "Save Prompt"}
      </button>
    </div>
  );
}

function RagTestTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ chapter_num: number; chapter_title: string; text: string; score?: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    setResults([]);
    fetch("/api/admin/rag-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK: 5 }),
    })
      .then((r) => r.json())
      .then((data) => { setResults(data.chunks || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2">RAG Query Test</h3>
      <p className="text-xs text-foreground-muted mb-3">Test semantic search over the book knowledge base. See which passages the AI would retrieve for a given question.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          placeholder="e.g. What does Saturn in the 10th house mean?"
          className="input-field flex-1"
        />
        <button onClick={handleSearch} disabled={loading || !query} className="btn-primary disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </div>
      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((r, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-primary">Ch.{r.chapter_num}: {r.chapter_title}</span>
                {r.score !== undefined && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{(r.score * 100).toFixed(0)}% match</span>
                )}
              </div>
              <p className="mt-2 text-sm text-foreground-muted">{r.text}</p>
            </Card>
          ))}
        </div>
      )}
      {results.length === 0 && !loading && query && (
        <p className="mt-4 text-sm text-foreground-muted">No results. Try a different query.</p>
      )}
    </div>
  );
}

function CacheTab() {
  const [cacheFiles, setCacheFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadCache = () => {
      fetch("/api/admin/cache")
        .then((r) => r.json())
        .then((data) => { if (active) { setCacheFiles(data.files || []); setTimeout(() => setLoading(false), 0); } })
        .catch(() => { setTimeout(() => setLoading(false), 0); });
    };
    loadCache();
    return () => { active = false; };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetch("/api/admin/cache")
      .then((r) => r.json())
      .then((data) => { setCacheFiles(data.files || []); setTimeout(() => setLoading(false), 0); })
      .catch(() => setTimeout(() => setLoading(false), 0));
  };

  if (loading) return <div className="text-sm text-foreground-muted">Loading cache...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Horoscope Cache ({cacheFiles.length} files)</h3>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="btn-ghost text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button onClick={() => { fetch("/api/admin/cache", { method: "DELETE" }).then(() => handleRefresh()); }} className="btn-ghost text-xs text-error">
            <Trash2 className="h-3.5 w-3.5" /> Clear All
          </button>
        </div>
      </div>
      {cacheFiles.length === 0 ? (
        <p className="text-sm text-foreground-muted">Cache is empty.</p>
      ) : (
        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {cacheFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs">
              <Database className="h-3 w-3 text-primary" />
              <span className="font-mono text-foreground-muted">{f}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}