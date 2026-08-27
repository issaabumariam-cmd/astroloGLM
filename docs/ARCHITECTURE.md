# Astrolo — World-Class Astrology PWA
## Architecture Plan (for approval before coding)

---

## 1. Product Vision

A bilingual (EN + AR/RTL) astrology web app (PWA) with:
- Digitized classic astrology book as structured, searchable knowledge base
- AI advisor powered by Ollama (Qwen 2.5 7B) with RAG over the book
- Daily/weekly horoscopes (AI-generated)
- Personality profiles per zodiac sign
- Compatibility between signs
- Birth chart analysis
- Freemium monetization (limited free tier, premium unlocks AI + deep content)
- Display ads on free tier
- Global audience, light & elegant design

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + React + TypeScript | Best SEO for content PWA, SSR/SSG, global reach |
| **Styling** | Tailwind CSS + shadcn/ui | Fast, consistent, elegant components |
| **Fonts** | Google Fonts (Cormorant Garamond for headings, Inter for body, Cairo/Noto Naskh Arabic for AR) | Elegant serif + clean sans + Arabic support |
| **i18n / RTL** | next-intl | Built-in bilingual + RTL handling |
| **Database** | PostgreSQL (Supabase) | User accounts, chat history, usage limits, content CMS |
| **Auth** | Supabase Auth (email + Google OAuth + anonymous) | Global, easy, free tier generous |
| **Vector store** | pgvector (Supabase extension) | Store book embeddings for RAG, single DB |
| **Embeddings** | Ollama `nomic-embed-text` | Runs alongside the LLM, no extra API cost |
| **LLM** | Ollama Cloud — Qwen 2.5 7B | Best Arabic + creative quality in its class |
| **Payments** | Stripe (subscriptions) + AdSense (display ads) | Global monetization |
| **Hosting (web)** | Vercel | Next.js native, free tier, edge CDN |
| **Hosting (Ollama)** | Ollama Cloud (managed) or cloud GPU VPS | Scales with demand |
| **Analytics** | PostHog (self-hosted or cloud) | Product analytics, funnels, free tier |

---

## 3. Folder Structure

```
astrolo/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # /en, /ar (i18n + RTL)
│   │   ├── layout.tsx           # Root layout (fonts, theme, direction)
│   │   ├── page.tsx              # Landing / homepage
│   │   ├── horoscope/
│   │   │   ├── page.tsx          # All signs → today's horoscope
│   │   │   └── [sign]/page.tsx   # Per-sign daily/weekly horoscope
│   │   ├── signs/
│   │   │   └── [sign]/page.tsx   # Personality profile per sign
│   │   ├── compatibility/
│   │   │   └── page.tsx          # Pick two signs → match result
│   │   ├── advisor/              # AI chat advisor
│   │   │   └── page.tsx
│   │   ├── birth-chart/          # Birth chart analysis (needs birth data)
│   │   │   └── page.tsx
│   │   ├── book/                 # Browsable digitized book
│   │   │   ├── page.tsx          # Table of contents
│   │   │   └── [chapter]/page.tsx
│   │   ├── pricing/              # Plans + subscribe
│   │   │   └── page.tsx
│   │   ├── account/              # Settings, subscription status, history
│   │   │   └── page.tsx
│   │   └── auth/
│   │       ├── login/page.tsx
│   │       └── signup/page.tsx
│   ├── api/
│   │   ├── chat/route.ts         # AI advisor streaming endpoint
│   │   ├── horoscope/route.ts    # Generate/fetch daily horoscope
│   │   ├── birth-chart/route.ts  # Birth chart calculation + AI interpretation
│   │   ├── compatibility/route.ts
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   └── webhook/route.ts
│   │   └── rag/search/route.ts   # Search the book knowledge base
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn primitives
│   ├── layout/                   # Header, Footer, Nav
│   ├── horoscope/                # SignCard, HoroscopeReading, PlanetGlyph
│   ├── advisor/                  # ChatWindow, MessageBubble, PromptSuggestions
│   ├── compatibility/            # CompatibilityPicker, CompatibilityMeter
│   ├── book/                     # BookReader, ChapterNav
│   ├── auth/                     # AuthForms
│   └── shared/                   # LoadingState, ErrorState, EmptyState, etc.
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (RSC)
│   │   └── admin.ts              # Service-role client (server only)
│   ├── ollama/
│   │   ├── client.ts             # Ollama API wrapper
│   │   ├── embeddings.ts         # Embed text chunks
│   │   ├── rag.ts                # Retrieve → augment → generate
│   │   └── prompts.ts            # System prompts (EN + AR)
│   ├── astrology/
│   │   ├── signs.ts              # 12 signs metadata
│   │   ├── planets.ts            # Planet data + glyphs
│   │   ├── houses.ts             # 12 houses meanings
│   │   ├── aspects.ts            # Aspect meanings
│   │   ├── chart.ts              # Birth chart calculation (astronomical)
│   │   └── ephemeris.ts          # Planet positions for a date
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── messages/en.json
│   │   └── messages/ar.json
│   └── utils/
├── scripts/
│   ├── ingest-book.ts            # Parse + chunk + embed book → pgvector
│   └── generate-horoscopes.ts    # Cron job: pre-generate daily horoscopes
├── supabase/
│   └── migrations/               # SQL migrations
├── public/
│   ├── icons/                    # Zodiac sign SVG glyphs
│   ├── zodiac-wheel.svg
│   └── manifest.json             # PWA manifest
├── next.config.mjs
├── tailwind.config.ts
├── package.json
└── ARCHITECTURE.md
```

---

## 4. Database Schema (PostgreSQL / Supabase)

```sql
-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id),
  email text,
  display_name text,
  locale text default 'en',
  birth_date date,
  birth_time time,
  birth_place text,
  birth_lat numeric,
  birth_lng numeric,
  zodiac_sign text,                -- computed from birth_date
  subscription_status text default 'free',  -- free | premium
  subscription_ends_at timestamptz,
  ai_questions_used int default 0,
  ai_questions_limit int default 3, -- free tier: 3/month
  ai_questions_reset_at timestamptz,
  created_at timestamptz default now()
);

-- Book content (structured from the PDF)
create table book_chapters (
  id serial primary key,
  chapter_num int,
  title text,
  summary text,
  content text,                   -- full chapter text
  locale text default 'en'
);

create table book_sections (
  id serial primary key,
  chapter_id int references book_chapters(id),
  section_num int,
  title text,
  content text,                   -- section-level text
  page_start int,
  page_end int
);

-- RAG embeddings (pgvector)
create table book_embeddings (
  id bigserial primary key,
  chapter_id int,
  section_id int,
  chunk_text text,
  embedding vector(768),           -- nomic-embed-text dim
  page_num int
);
create index on book_embeddings using ivfflat (embedding vector_cosine_ops);

-- Horoscopes (pre-generated, cached)
create table horoscopes (
  id bigserial primary key,
  sign text,                       -- aries, taurus, ...
  scope text,                      -- daily | weekly | monthly
  date date,
  locale text,
  content text,                    -- AI-generated horoscope text
  mood int,                        -- 1-5 mood rating
  lucky_number int,
  lucky_color text,
  created_at timestamptz default now(),
  unique(sign, scope, date, locale)
);

-- AI chat history
create table chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  topic text,                     -- 'advisor' | 'birth_chart' | 'compatibility'
  created_at timestamptz default now()
);

create table chat_messages (
  id bigserial primary key,
  thread_id uuid references chat_threads(id),
  role text,                      -- user | assistant
  content text,
  retrieved_chunks int[],         -- which book_embeddings were used
  tokens_used int,
  created_at timestamptz default now()
);

-- Usage tracking (for limits + analytics)
create table ai_usage (
  id bigserial primary key,
  user_id uuid,
  feature text,                   -- advisor | birth_chart | horoscope_gen
  tokens_in int,
  tokens_out int,
  cost_estimate numeric,
  created_at timestamptz default now()
);

-- Compatibility reports (cached)
create table compatibility_reports (
  id bigserial primary key,
  sign1 text,
  sign2 text,
  locale text,
  content text,                   -- AI-generated compatibility reading
  love_score int,                 -- 0-100
  communication_score int,
  trust_score int,
  created_at timestamptz default now(),
  unique(sign1, sign2, locale)
);

-- Subscriptions (mirror Stripe)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,                      -- monthly | yearly
  status text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);
```

---

## 5. AI / RAG Pipeline

### Book Ingestion (one-time, scripted)
```
PDF → extract text (with OCR cleanup) → chunk by section (~500 tokens)
     → embed with nomic-embed-text → store in pgvector
```

### RAG Query Flow (runtime)
```
User question → embed question → vector search top-K chunks (K=5)
             → augment prompt with retrieved chunks + astrology context
             → Qwen 2.5 7B generates answer (streamed)
             → save to chat_messages with retrieved chunk IDs
```

### System Prompt (example, EN)
```
You are an expert astrologer trained on classical astrology (C.A.Q. Libra, 1917).
Answer the user's question using ONLY the retrieved book passages and standard
astrological knowledge. Be warm, insightful, and specific. Keep responses concise
(under 300 words unless asked for depth). Never give medical/legal/financial advice.
If the user's birth chart data is available, incorporate it.
```

### Horoscope Generation (cron, daily)
- For each of 12 signs × 2 locales = 24 generations/day
- Uses current planetary transits + sign traits + RAG for tone
- Cached in `horoscopes` table → served instantly to users
- Cost: ~24 × 400 tokens × Qwen 2.5 ≈ negligible

---

## 6. Monetization Design

| Tier | Price | Features |
|---|---|---|
| **Free** | $0 | Daily horoscope (all signs), personality profiles (basic), compatibility (score only, no deep reading), 3 AI advisor questions/month, display ads |
| **Premium** | $4.99/mo or $39.99/yr | Unlimited AI advisor, full birth chart analysis, deep compatibility readings, weekly/monthly reports, ad-free, bookmark + chat history, exclusive book chapters |

### Gating logic
- Server-side check in `/api/chat`: if `subscription_status='free'` and `ai_questions_used >= ai_questions_limit` → return 402
- Premium features check `subscription_status='premium'` before rendering deep content
- Stripe webhook updates `profiles.subscription_status` on payment

---

## 7. Design System (Light & Elegant)

| Token | Value |
|---|---|
| Background | `#FAF7F2` (warm cream) |
| Surface (cards) | `#FFFFFF` |
| Primary accent | `#8B7355` (muted gold/bronze) |
| Secondary | `#A8B5A0` (soft sage) |
| Text primary | `#2C2825` (warm near-black) |
| Text secondary | `#6B6157` |
| Error | `#C04A4A` (muted red) |
| Border | `#E8E2D8` |
| Radius (cards) | 16px |
| Radius (buttons) | 8px |
| Heading font | Cormorant Garamond (serif, elegant) |
| Body font | Inter (clean sans) |
| Arabic font | Cairo or Noto Naskh Arabic |
| Max content width | 720px (reading) / 1200px (app) |
| Section headers | UPPERCASE, letter-spacing 2px |
| Shadows | `0 2px 8px rgba(44,40,37,0.06)` (subtle) |

### PWA
- `manifest.json` with app name, icons (zodiac wheel), theme color
- Service worker for offline horoscope caching
- Installable on mobile + desktop

---

## 8. Key Pages (build order)

1. **Landing** — Hero with zodiac wheel, CTA to pick sign, daily horoscope preview
2. **Horoscope** — Sign picker → today's reading (cached from DB)
3. **Sign profiles** — 12 signs with traits (from book + standard data)
4. **Compatibility** — Two-sign picker → love/comm/trust scores + reading (premium)
5. **AI Advisor** — Chat interface (freemium gated)
6. **Birth chart** — Form (date/time/place) → chart + AI interpretation (premium)
7. **Book reader** — Browse chapters, searchable (freemium: some chapters locked)
8. **Pricing** — Plans, Stripe checkout
9. **Account** — Profile, subscription status, chat history, birth data

---

## 9. Dev Phases

### Phase 1 — Foundation (week 1)
- Next.js project setup, Tailwind, shadcn, i18n (EN + AR), RTL
- Supabase setup, migrations, auth
- Design system implementation (theme, fonts, components)
- Landing page + header/footer/nav

### Phase 2 — Content (week 2)
- Book ingestion script (PDF → clean text → chunk → embed → pgvector)
- Sign profiles pages (12 signs)
- Horoscope generation script + pages
- Compatibility (score calculation + UI)

### Phase 3 — AI Advisor (week 3)
- Ollama Cloud integration (chat + embeddings)
- RAG pipeline (retrieve → augment → generate, streaming)
- Chat UI (messages, suggestions, history)
- Freemium gating (3 free questions)
- Birth chart calculation + AI interpretation

### Phase 4 — Monetization (week 4)
- Stripe integration (checkout, webhook, subscription status)
- AdSense integration (free tier)
- Pricing page, account page
- PWA manifest + service worker
- SEO (sitemap, meta, structured data per sign)
- Deploy to Vercel

---

## 10. Open Decisions

- [ ] **Brand name** — placeholder "Astrolo" for now
- [ ] **Ollama Cloud provider** — Ollama doesn't have an official cloud; options: RunPod, Replicate, or self-hosted VPS. Need to pick.
- [ ] **Domain** — need to register
- [ ] **Book OCR cleanup** — the PDF scan is messy; may need Tesseract OCR re-scan for clean text
- [ ] **Birth chart engine** — use `astronomia`/`swisseph` JS port, or call an external ephemeris API?

---

## Next Step

**Approve this plan and I'll start Phase 1: project scaffold + design system + landing page.**
Reply with any changes or just say "approved" to begin.