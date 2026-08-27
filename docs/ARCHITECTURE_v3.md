# Astrolo — Europe-Focused Architecture Plan
## v3 — English + European Languages, Europe + MENA cities

> **Revisions 2026-08-27 (session 5):** reflects as-built reality.
> - **LLM:** `gemma4:31b-cloud` via singularitAI AI Gateway (not Qwen/Llama as originally drafted) — bigger model, better quality, gateway handles retry/rate-limit.
> - **Ephemeris:** Moshier (`ephemeris` npm v2.2.0, pure JS, ~0.1 arcsec) — not Swiss Ephemeris. `swisseph` uses node-gyp native bindings (fragile on Windows + Vercel). Moshier is accuracy-equivalent for natal charts; footer correctly says "Moshier ephemeris."
> - **Scope:** Europe + MENA. `COMMON_CITIES` includes Amman, Dubai, Istanbul, Riyadh, Jeddah, Mecca, Medina, Dammam alongside EU capitals. Not Europe-only.

---

## Decision: Why Europe + MENA

> **Updated 2026-08-27:** Originally drafted as "Europe only, no MENA." In practice (sessions 3-5) the city list grew to include Amman, Dubai, Istanbul, and Saudi cities, and Issa confirmed this is intentional. The product serves **Europe + MENA** — English-first for the EU pilot, MENA cities available for the Levant/Gulf audience. The strategic moat (European-native premium natal-chart PWA with AI) still holds; MENA is additive, not a pivot.

- **$929M market** (24.5% of global astrology app market)
- **Crowded but colonized** — all major apps are US-built, English-first (Co-Star, The Pattern, CHANI)
- **Only Astro.com (Swiss web tool) and Nebula (Ukrainian, trust-damaged) are European-built**
- **No premium multilingual European-native natal-chart app exists** — this is the gap
- Europe has the highest premium ARPU globally
- GDPR lets us turn privacy into a brand feature ("your birth data is sacred")
- No religious/legal sensitivity around astrology in Europe (unlike MENA)
- Stripe + SEPA + iDEAL + Bancontact + SOFORT/Klarna covers ~95% of European payments

---

## Product Vision (Refined)

A **world-class astrology PWA** for Europe:
- English-first, extensible to German, French, Spanish, Italian, Dutch, Nordic
- Real natal chart calculation (Moshier ephemeris — Astro.com-accuracy)
- AI advisor powered by Ollama, RAG on a classic astrology book
- Light & elegant design (differentiates from saturated dark-cosmic aesthetic)
- Privacy-first / GDPR-exemplary as a brand feature
- Freemium subscription with PPP-adjusted European pricing
- PWA distribution (no app-store IAP tax, instant onboarding, SEO advantage)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + React + TypeScript | SEO, SSR/SSG, PWA, European edge CDN |
| **Styling** | Tailwind CSS + shadcn/ui + Radix | Fast, accessible, elegant |
| **Fonts** | Cormorant Garamond (headings), Inter (body), + per-locale as needed | Elegant serif + clean sans |
| **i18n** | next-intl | Extensible to DE/FR/ES/IT/NL/SV/DA |
| **Database** | PostgreSQL (Supabase) + pgvector | Users, content, RAG embeddings |
| **Auth** | Supabase Auth (email + Google OAuth + anonymous) | GDPR-compliant, EU data residency option |
| **Ephemeris** | Moshier ephemeris (`ephemeris` npm, pure JS, ~0.1 arcsec) | Accuracy-equivalent to Swiss Ephemeris for natal charts; no native bindings → deploys cleanly to Vercel. `swisseph` (node-gyp) was rejected as a deploy risk. |
| **LLM** | `gemma4:31b-cloud` via singularitAI AI Gateway (X-API-Key auth) | Strong English + creative quality; gateway adds retry/backoff, concurrency limiting, typed errors. |
| **Embeddings** | `nomic-embed-text` (768-dim, via same gateway) | Runs alongside the LLM, single key/auth path |
| **Payments** | Stripe (SEPA, iDEAL, Bancontact, SOFORT, Klarna) + PayPal | Covers ~95% of European payment preferences |
| **Hosting (web)** | Vercel (EU edge) | Next.js native, GDPR-friendly |
| **Hosting (Ollama)** | RunPod / Replicate (EU region) | Low latency for European users |
| **Analytics** | Plausible (privacy-first, no cookies) | GDPR-compliant, no cookie banner needed |
| **Ads** | None on premium; optional AdSense on free tier (EU consent required) | Keep it clean |

---

## Design System (Light & Elegant)

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
| Max content width | 720px (reading) / 1200px (app) |
| Section headers | UPPERCASE, letter-spacing 2px |
| Shadows | `0 2px 8px rgba(44,40,37,0.06)` (subtle) |

**Why this works in Europe:** CHANI (light/punk-zine) and The Pattern (warm/illustrative) prove the light aesthetic works. Every other app is dark-cosmic — we differentiate immediately.

---

## Core Features

### Phase 1 (MVP)
| Feature | Free | Premium | Notes |
|---|---|---|---|
| Daily horoscope (sun-sign) | ✅ | ✅ | Pre-generated, cached, SEO-indexed per sign |
| Birth chart calculation (Moshier ephemeris) | ✅ | ✅ | Real chart — the credibility foundation |
| Birth chart interpretation | Big Three only | Full (houses, aspects, planets, dominant) | AI-assisted |
| Personality profiles (12 signs) | ✅ | ✅ | From book + standard astrological data |
| Compatibility (sign-pair) | Score only | Deep reading + AI analysis | Highly viral + shareable |
| AI advisor (chat) | 3 questions/month | Unlimited | RAG on book, multi-turn, birth-chart-aware |
| Book reader (digitized) | Sample chapters | Full library | Searchable |
| Weekly horoscope | — | ✅ | AI-generated per sign |
| Monthly forecast | — | ✅ | AI-generated |

### Phase 2 (Differentiators)
| Feature | Why |
|---|---|
| **Astro 101 education** | Tap any astrological term → learn it. CHANI model. Reduces bounce, builds authority |
| **Interactive chart wheel** | Beautiful + educational. No one has nailed this — it's a visual differentiator |
| **Transit-to-life mapping** | "What does Mars square Neptune mean for YOUR week, YOUR projects, YOUR relationships" — personalized |
| **Transit calendar** | Mercury retrograde alerts, new/full moon dates, eclipse tracking |
| **Journaling + wellness** | Frames astrology as self-knowledge (aligns with European wellness culture) |
| **Hamburg School midpoints** (DE only) | German astrological tradition — niche but loyal, uncopyable by US apps |
| **Psychological astrology framing** | Liz Greene / Jungian tradition — European authority, distinct from US apps |

### Phase 3 (Scale)
| Feature | Why |
|---|---|
| **Live astrologer marketplace** | European astrologer pool (EN/DE/FR/IT). Sanctuary model, no European incumbent |
| **Solar return charts** | Birthday-specific yearly forecast — proven converter on Astro.com shop |
| **Synastry (two full birth charts)** | Deeper than sign-pair compatibility — premium upgrade |
| **One-time report purchases** | Birth chart report, yearly forecast, love compatibility — $14.99-24.99 each |

---

## Language Rollout

| Phase | Languages | Markets |
|---|---|---|
| **Phase 1** | English | UK, Scandinavia, Netherlands, global English speakers |
| **Phase 2** | + German | Germany, Austria, Switzerland (largest EU premium market) |
| **Phase 3** | + French, Spanish, Italian | France, Belgium, Spain, Italy |
| **Phase 4** | + Dutch, Swedish, Danish | Benelux, Nordic |

**Note:** English covers UK + Scandinavia + Netherlands immediately (high English fluency). German is the first localization priority (largest non-English EU market, strong astrology culture, Hamburg School heritage).

---

## Pricing (PPP-Adjusted, Geo-IP Detected)

| Region | Monthly | Annual | One-time natal report |
|---|---|---|---|
| UK | £5.99 | £49 | £19.99 |
| Scandinavia (SE, NO, DK, FI) | €6.99 | €59 | €22.99 |
| Germany / Austria / Switzerland | €5.99 | €49 | €19.99 |
| France / Belgium | €5.99 | €49 | €19.99 |
| Netherlands | €5.99 | €49 | €19.99 |
| Spain / Italy | €4.99 | €39 | €14.99 |
| Rest of Europe | €4.99 | €39 | €14.99 |

**Implementation:** Stripe supports country-specific pricing via geo-IP. Annual plans get a ~30% discount to drive yearly conversions.

---

## Database Schema

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
  zodiac_sign text,
  subscription_status text default 'free',
  subscription_ends_at timestamptz,
  ai_questions_used int default 0,
  ai_questions_limit int default 3,
  ai_questions_reset_at timestamptz,
  created_at timestamptz default now()
);

-- Book content (structured from the PDF)
create table book_chapters (
  id serial primary key,
  chapter_num int,
  title text,
  summary text,
  content text,
  locale text default 'en'
);

create table book_sections (
  id serial primary key,
  chapter_id int references book_chapters(id),
  section_num int,
  title text,
  content text,
  page_start int,
  page_end int
);

-- RAG embeddings (pgvector)
create table book_embeddings (
  id bigserial primary key,
  chapter_id int,
  section_id int,
  chunk_text text,
  embedding vector(768),
  page_num int
);
create index on book_embeddings using ivfflat (embedding vector_cosine_ops);

-- Horoscopes (pre-generated, cached)
create table horoscopes (
  id bigserial primary key,
  sign text,
  scope text,                       -- daily | weekly | monthly
  date date,
  locale text,
  content text,
  mood int,                          -- 1-5
  lucky_number int,
  lucky_color text,
  created_at timestamptz default now(),
  unique(sign, scope, date, locale)
);

-- AI chat history
create table chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  topic text,                       -- advisor | birth_chart | compatibility
  created_at timestamptz default now()
);

create table chat_messages (
  id bigserial primary key,
  thread_id uuid references chat_threads(id),
  role text,                        -- user | assistant
  content text,
  retrieved_chunks int[],
  tokens_used int,
  created_at timestamptz default now()
);

-- Usage tracking
create table ai_usage (
  id bigserial primary key,
  user_id uuid,
  feature text,
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
  content text,
  love_score int,
  communication_score int,
  trust_score int,
  created_at timestamptz default now(),
  unique(sign1, sign2, locale)
);

-- Transits / astrological events
create table astro_events (
  id bigserial primary key,
  event_type text,                   -- mercury_retrograde | new_moon | full_moon | eclipse | conjunction
  date date,
  end_date date,
  description text,
  significance text
);

-- Subscriptions (mirror Stripe)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,                         -- monthly | yearly
  status text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- Content translations (for multi-language)
create table content_translations (
  id bigserial primary key,
  entity_type text,                  -- sign | planet | house | aspect
  entity_id text,
  locale text,
  field text,                        -- name | description | traits | keywords
  value text
);

-- Geo-pricing
create table pricing_tiers (
  id serial primary key,
  country_code text,
  monthly_price numeric,
  annual_price numeric,
  report_price numeric,
  currency text
);
```

---

## Folder Structure

```
astrolo/
├── app/
│   ├── [locale]/                    # /en, /de, /fr, /es, /it (i18n)
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Landing
│   │   ├── horoscope/
│   │   │   ├── page.tsx             # All signs → today
│   │   │   └── [sign]/page.tsx      # Per-sign daily/weekly
│   │   ├── signs/
│   │   │   └── [sign]/page.tsx      # Personality profile
│   │   ├── compatibility/
│   │   │   └── page.tsx             # Two-sign picker → match
│   │   ├── advisor/                 # AI chat advisor
│   │   │   └── page.tsx
│   │   ├── birth-chart/
│   │   │   └── page.tsx             # Birth chart + interpretation
│   │   ├── transits/                # Current sky + transit calendar
│   │   │   └── page.tsx
│   │   ├── book/
│   │   │   ├── page.tsx             # Table of contents
│   │   │   └── [chapter]/page.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── account/
│   │   │   └── page.tsx
│   │   └── auth/
│   │       ├── login/page.tsx
│   │       └── signup/page.tsx
│   ├── api/
│   │   ├── chat/route.ts            # AI advisor streaming
│   │   ├── horoscope/route.ts
│   │   ├── birth-chart/route.ts
│   │   ├── compatibility/route.ts
│   │   ├── transits/route.ts
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   └── webhook/route.ts
│   │   └── rag/search/route.ts
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn primitives
│   ├── layout/                      # Header, Footer, Nav
│   ├── horoscope/                   # SignCard, HoroscopeReading, PlanetGlyph
│   ├── advisor/                     # ChatWindow, MessageBubble, PromptSuggestions
│   ├── compatibility/               # CompatibilityPicker, CompatibilityMeter
│   ├── chart/                       # ChartWheel, PlanetPosition, AspectGrid
│   ├── book/                        # BookReader, ChapterNav
│   ├── transits/                    # TransitTimeline, RetrogradeBanner
│   ├── auth/                        # AuthForms
│   └── shared/                      # LoadingState, ErrorState, EmptyState
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── ollama/
│   │   ├── embeddings.ts           # nomic-embed-text (768-dim) via singularitAI gateway
│   │   ├── rag.ts                    # Retrieve → augment → generate
│   │   ├── gateway-fetch.ts        # singularitAI gateway wrapper (retry, rate-limit, typed errors)
│   │   └── headers.ts              # X-API-Key auth helper
│   ├── astrology/
│   │   ├── signs.ts                 # 12 signs metadata
│   │   ├── planets.ts               # Planet data + glyphs
│   │   ├── houses.ts                # 12 houses meanings
│   │   ├── aspects.ts               # Aspect meanings
│   │   ├── chart.ts                  # Birth chart types + legacy calc (equal-house)
│   │   ├── placidus.ts              # Real Placidus house cusps + natal chart (Moshier ephemeris, iterative semi-arc)
│   │   ├── transits.ts              # Current planet positions
│   │   ├── transit-natal.ts         # Transit-to-natal aspect mapping
│   │   ├── astro-events.ts          # Mercury retrograde, new/full moon, eclipses
│   │   ├── compatibility.ts         # Sign-pair compatibility scoring
│   │   ├── horoscope.ts             # Horoscope data + caching
│   │   ├── horoscope-ai.ts          # AI horoscope generation (sun-sign)
│   │   ├── sign-reading.ts          # AI sign-profile generation
│   │   ├── echo.ts                  # Echo chat (quick birth-chart-aware chat)
│   │   └── timezone.ts              # Lat/lng → timezone → UTC conversion
│   ├── prompts.ts                   # System prompts (EN, advisor/horoscope/compatibility)
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   ├── i18n/
│   │   ├── config.ts
│   │   └── messages/                # en.json, de.json, fr.json, ...
│   └── utils/
├── scripts/
│   ├── ingest-book.ts               # Parse + chunk + embed book → pgvector
│   └── generate-horoscopes.ts       # Cron: pre-generate daily horoscopes
├── supabase/
│   └── migrations/
├── public/
│   ├── icons/                       # Zodiac sign SVG glyphs
│   ├── zodiac-wheel.svg
│   └── manifest.json
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

---

## GDPR / Privacy-First Strategy (Brand Feature)

This is a differentiator — US astrology apps track users heavily (Surfshark research). We turn privacy into marketing:

1. **EU data residency** — Supabase EU region, Vercel EU edge, Ollama EU cloud
2. **Privacy-by-design** — birth data encrypted at rest, minimal data collection, no third-party tracking
3. **No cookies** — Plausible analytics (cookieless), no AdSense in EU without consent
4. **Explicit consent flow** — clean, European-grade cookie/consent banner
5. **Right to erasure** — one-click "delete my birth data" in account settings
6. **Data portability** — export your birth chart + chat history as JSON
7. **Transparency page** — public `/privacy` explaining exactly what we collect and why
8. **Marketing angle:** "Your birth data is sacred. We treat it that way."

---

## Monetization

| Tier | Price (UK) | Features |
|---|---|---|
| **Free** | £0 | Daily horoscope (all signs), birth chart calculation, Big Three interpretation, personality profiles, compatibility score, 3 AI advisor questions/month, book sample chapters |
| **Premium** | £5.99/mo or £49/yr | Unlimited AI advisor, full birth chart interpretation, weekly/monthly forecasts, deep compatibility readings, full book library, transit calendar, journaling, ad-free |
| **One-time reports** | £19.99 | Detailed natal chart report (PDF), yearly forecast, love compatibility report |

**Gating logic:**
- Server-side check in `/api/chat`: if free and `ai_questions_used >= limit` → 402
- Premium features check `subscription_status='premium'` before rendering deep content
- Stripe webhook updates `profiles.subscription_status` on payment

---

## Roadmap

### Phase 1 — Foundation + MVP (weeks 1-4)
- Next.js + Tailwind + shadcn + next-intl (English, locale-ready)
- Supabase setup + auth + migrations
- Design system (light & elegant, cream/gold)
- Moshier ephemeris integration (birth chart calculation)
- Landing page + nav + footer
- 12 sign profiles (from book + standard data)
- Daily horoscope (pre-generated, cached, SEO-optimized)
- Compatibility (score + basic reading)
- Book ingestion (PDF → clean text → chunk → embed → pgvector)
- AI advisor (RAG, multi-turn chat, 3 free questions)
- Stripe payments + freemium gating
- PWA manifest + service worker
- Deploy to Vercel (EU edge)
- GDPR consent flow + privacy page

### Phase 2 — Differentiation (weeks 5-8)
- Weekly/monthly horoscopes (AI-generated)
- Full birth chart interpretation (AI-assisted)
- Transit tracking + calendar (Mercury retrograde, moons, eclipses)
- Astro 101 education (tap any term → learn)
- Interactive chart wheel (beautiful + educational)
- Journaling + wellness integration
- German language (DE)
- Geo-pricing (PPP-adjusted)
- One-time report purchases (Stripe)

### Phase 3 — Scale (weeks 9-12)
- French, Spanish, Italian languages
- Hamburg School midpoint module (DE only)
- Psychological astrology framing (Liz Greene tradition)
- Synastry (two full birth charts)
- Solar return charts
- Live astrologer marketplace (European astrologer pool)
- Partnership with Faculty of Astrological Studies / CPA London

### Phase 4 — Long-tail (weeks 13+)
- Dutch, Swedish, Danish, Portuguese
- Advanced features: progressions, astrocartography, electional astrology
- Mobile app wrappers (TWA) if distribution requires

---

## Open Decisions

- [x] **Brand name** — "Astrolo" (kept)
- [x] **LLM model** — `gemma4:31b-cloud` via singularitAI AI Gateway (decided in sessions 4-5; bigger than the originally drafted Qwen/Llama)
- [x] **Ephemeris** — Moshier (`ephemeris` npm), not Swiss Ephemeris (decided session 2; confirmed session 5 — node-gyp deploy risk)
- [x] **MENA scope** — Europe + MENA, not Europe-only (confirmed by Issa, session 5)
- [ ] **Ollama hosting** — singularitAI gateway is current; evaluate cost/latency vs RunPod/Replicate EU as scale grows
- [ ] **Book OCR cleanup** — 1917 PDF scan ingestion is done (`data/book_chunks_embedded.json`, 1,444 chunks); quality is sufficient for RAG but a Tesseract re-scan could improve edge cases
- [ ] **Domain** — register (.app, .astrology, or .com); `astrolo.app` DNS has SOA only, no A/CNAME to Vercel yet
- [ ] **Pilot market** — UK (largest English EU market) per `EUROPE_PILOT_RESEARCH.md`; Netherlands as second expansion

---

## What Makes This World-Class

1. **No incumbent does this** — premium multilingual European-native natal-chart PWA with AI
2. **Moshier ephemeris** — ~0.1 arcsec accuracy, pure JS (no native bindings), deploys cleanly to Vercel. Swiss-Ephemeris-equivalent for natal charts; chosen over `swisseph` (node-gyp) to avoid Windows/Vercel deploy fragility. Brand claim is "Moshier ephemeris," not "Swiss Ephemeris."
3. **Light & elegant design** — differentiates from saturated dark-cosmic aesthetic
4. **GDPR-first as brand feature** — "your birth data is sacred"
5. **PWA advantage** — no IAP tax (15-30%), instant onboarding, SEO, no app-store review friction
6. **AI advisor** — RAG on real astrology book, multi-turn, birth-chart-aware
7. **European traditions** — Hamburg School (DE), psychological astrology (Liz Greene) — uncopyable by US apps
8. **PPP pricing** — accessible in every European market
9. **Privacy-first analytics** — Plausible, no cookies, no tracking
10. **Astro 101 education** — builds authority, reduces bounce, creates retention

---

## Next Step

Review this Europe-focused plan. Key questions:

1. **Brand name** — keep "Astrolo" or brainstorm?
2. **LLM model** — ~~Qwen 2.5 7B or Llama 3.1 8B?~~ **Decided: `gemma4:31b-cloud`** via singularitAI AI Gateway (bigger model, gateway handles retry/rate-limit)
3. **Pilot market** — UK or Germany first?
4. **Ready to start Phase 1?**

Reply "approved" to begin Phase 1, or tell me what to change.