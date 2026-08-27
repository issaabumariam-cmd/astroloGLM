# Astrolo — Jehana Onboarding & Chat UX Plan

## v1 — 2026-08-27

> **Status:** Plan for approval before implementation. Analyzes the as-built `/echo` + `/advisor` flows, identifies UX gaps, and proposes a world-class unified experience.

---

## 1. What exists today (as-built)

Two separate entry points, two separate UIs, one shared backend:

### `/echo` — "Meet Jehana" onboarding (standalone page)
A 5-stage linear funnel:

| Stage | What happens | UX |
|---|---|---|
| `input` | Birth date + time (optional) + city dropdown (17 cities) | Single Card, hero headline "The universe has already written your story" |
| `loading` | Spinner + "The cosmos is aligning..." | ZodiacWheel spin |
| `intro` | Chart preview (Sun/Moon/Rising glyphs) + Jehana's greeting + personality summary + 3 hook-question buttons | Card with Big Three, then chat-bubble intro, then numbered hook buttons |
| `hook-answer` → `hook-response` | User picks a hook → types answer → gets Jehana's response | One question at a time, textarea, "Share with Jehana" CTA |
| `upgrade` | After 2 exchanges → paywall Card | "You've barely begun" + feature list + £5.99/mo CTA + "try free advisor" fallback |

**API:** `/api/echo` (non-streaming, JSON) — `action: "intro"` calculates chart + generates Jehana intro (greeting, personality summary, 3 hook questions, follow-up); `action: "hook-response"` generates a single response per hook.

### `/advisor` — Jehana chat hub (main interface)
A 4-stage flow with a persistent chat UI:

| Stage | What happens |
|---|---|
| `choose` | Two cards: **Echo Chat** (free, per-sign, no birth date) vs **Deep Echo Chat** (free 3 questions, birth chart) |
| `per-sign` | 12-sign picker grid → starts a per-sign chat with a canned intro |
| `onboarding` | Birth date + time + city form (same as `/echo` input) → fetches chart + Jehana intro |
| `chat` | Full chat UI: message bubbles, streaming responses, RAG sources panel (collapsible), hook-question buttons, per-sign suggestions, upgrade prompt after 3 exchanges |

**API:** `/api/chat` (streaming, SSE) — sends chart data or sign context, retrieves RAG chunks, streams Jehana's response with sources + RAG metadata.

### The overlap (the core problem)

`/echo` and `/advisor`'s `onboarding` stage do **almost the same thing** — both ask for birth data, both call `/api/echo` for the intro, both present hook questions. But:

- `/echo` is a **linear, one-question-at-a-time** flow (better for first-time focus, worse for returning)
- `/advisor` is a **full chat** with hooks as side-buttons (better for returning, overwhelming for first-time)
- `/echo`'s hook flow is non-streaming (one response per hook)
- `/advisor`'s chat is streaming (real-time tokens)
- `/echo`'s upgrade → links to `/advisor` ("try the free advisor")
- `/advisor`'s upgrade → inline paywall

**Net: two competing implementations of the same product, with inconsistent UX.**

---

## 2. The product truth

Jehana is **one AI persona** with **two conversation modes**:

| | Echo Chat | Deep Echo Chat |
|---|---|---|
| **Input** | Sun sign only | Full birth chart (date + time + place) |
| **Knowledge** | General sign traits | Your actual Sun/Moon/Rising + all planets + houses + aspects |
| **RAG** | Optional | Yes (book passages retrieved per query) |
| **Cost tier** | Free, unlimited | Free 3 questions, then £5.99/mo |
| **Use case** | "I'm a Leo, what's my week?" | "How does my Moon in Scorpio affect my relationships?" |
| **Tone** | Friendly sign columnist | Wise friend who knows your chart |

The **onboarding** (birth-data entry + chart preview + Jehana intro) is a **shared funnel** — both modes start the same way for a new user, but Echo Chat skips it (just pick a sign).

---

## 3. Proposed unified UX

### 3.1 Single entry point: `/jehana` (replaces both `/echo` and `/advisor`)

One page, one flow, one chat. The `/echo` and `/advisor` routes redirect to `/jehana`.

```
/jehana
  ├── Stage 1: Welcome (choose mode)
  │     ├─ "I know my sign" → Echo Chat (pick sign → chat)
  │     └─ "I know my birth details" → Deep Echo Chat (onboarding → chat)
  │
  ├── Stage 2a: Echo onboarding (pick sign) → chat
  │
  ├── Stage 2b: Deep onboarding (birth data → chart preview → Jehana intro) → chat
  │
  └── Stage 3: Chat (unified, mode-aware)
        ├─ Mode badge in header ("Echo" or "Deep Echo")
        ├─ Free-tier counter (Deep Echo only: "2 free left")
        ├─ Streaming responses (both modes)
        ├─ RAG sources panel (Deep Echo only)
        ├─ Hook questions (Deep Echo only, first 3)
        ├─ Suggestions (Echo: per-sign; Deep Echo: chart-aware)
        └─ Upgrade prompt (Deep Echo after 3; Echo never)
```

### 3.2 Onboarding deep-dive (the "Meet Jehana" moment)

This is the highest-stakes UX — it's the first impression, the conversion driver, and the "wow" moment. Current `/echo` gets it right conceptually but the execution needs polish.

**The flow (Deep Echo onboarding):**

1. **Birth data entry** (current: works, keep)
   - Date (required), time (optional, with "deepens the reading" hint), city (dropdown, 17 cities)
   - Privacy reassurance: "Your birth data is sacred. The cosmos gave it — we protect it." (keep — this is brand-defining)
   - CTA: "Meet Jehana — Free" (keep)

2. **Loading** (current: works, enhance)
   - Current: spinner + "The cosmos is aligning..."
   - **Enhance:** progressive hints as the chart computes:
     - "Calculating your planetary positions..."
     - "Reading your houses and aspects..."
     - "Jehana is listening to your chart..."
   - These are fake-progress (the API is one call), but they reduce perceived wait anxiety. ~5s total. Each hint appears every ~1.5s.

3. **Chart reveal** (current: static Big Three, enhance)
   - Current: three glyph circles (Sun/Moon/Rising) side by side, static
   - **Enhance:** animated reveal — each glyph fades in sequentially (Sun → Moon → Rising), ~400ms apart, with a subtle scale-in. The degrees appear with a count-up animation (0° → actual degrees, ~600ms). This is the "wow" — the user *sees* their chart come alive.
   - If birth time was omitted: Moon + Rising appear with a "approximate" tag and a gentle "Add your birth time for precision" prompt (non-blocking, dismissible)

4. **Jehana's intro message** (current: greeting + personality summary + followUp, keep the structure)
   - **Enhance:** stream it token-by-token (like the chat does) instead of appearing all at once. This sets the expectation that Jehana *talks* to you, not *displays text*. Reuse the `/api/chat` streaming path for the intro.
   - The intro should reference the user's actual placements: "You're a **Cancer** Sun — that's your core, your vitality. Your **Scorpio** Moon adds depth and intensity beneath the surface. And with **Aquarius** rising, the world sees you as unconventional, forward-thinking." (Specific, not generic.)
   - End with the followUp: "I have some questions for you — things your chart makes me curious about. Shall we begin?"

5. **Hook questions** (current: 3 numbered buttons, keep but refine)
   - **Enhance:** present as conversational prompts, not a numbered list. After the intro stream completes, Jehana "asks":
     > "Your chart makes me curious about a few things. Pick one — or ask me anything:"
     > ◯ "How do you handle conflict?" *(based on your Mars-Saturn square)*
     > ◯ "What drains or energizes you?" *(based on your Sun in the 12th house)*
     > ◯ "What's your hidden strength?" *(based on your Jupiter trine Sun)*
   - The parenthetical chart-basis hint is the **transparency moat** — no competitor shows *why* the AI asked this. It builds trust ("Jehana isn't generic, she's reading MY chart").

6. **Hook exchange** (current: one question → textarea → response, keep)
   - User picks a hook → types their answer → gets Jehana's response (streaming, like chat)
   - After response: "Ask another question" or continue free-form chatting
   - Free counter: "2 free questions remaining" (subtle, non-urgent)

7. **Upgrade moment** (current: after 2 exchanges, a Card paywall, keep the trigger)
   - **Enhance:** Jehana says it in-chat (not a separate Card):
     > "I've loved reading the first pages of your chart with you. There are ten planets in twelve houses — each one a story. Would you like to go deeper?"
     > [Unlock Deep Echo — £5.99/month]  [Or keep chatting in Echo mode →]
   - The "keep chatting in Echo mode" fallback is critical — don't hard-wall. The user drops to Echo (per-sign) chat, not out of the product.

### 3.3 Echo onboarding (lightweight)

For users who pick "I know my sign":

1. 12-sign picker grid (current: works, keep)
2. Canned intro: "Hi! I'm Jehana. I see you're a Leo — fire energy, ruled by the Sun. [personality excerpt]. Ask me anything about your sign, transits, or the cosmic weather." (current: works, keep)
3. Per-sign suggestions appear as side-buttons (current: works, keep)
4. No upgrade prompt (Echo is free, unlimited)
5. A gentle upsell after ~5 exchanges: "Want a reading based on your *full* birth chart? Try Deep Echo →" (non-blocking, dismissible)

### 3.4 The chat (unified)

Both modes converge into the same chat UI, mode-aware:

- **Header:** Jehana avatar (✦) + mode badge ("Echo" green / "Deep Echo" gold) + free counter (Deep Echo only) + "New Chat" button
- **Messages:** streaming bubbles, user right / Jehana left, same as current `/advisor` chat
- **RAG sources:** collapsible panel under each Deep Echo response (current: works, keep) — NOT shown in Echo mode (no RAG there)
- **Suggestions:** Echo = per-sign suggestions; Deep Echo = chart-aware hooks (first 3) then free-form
- **Input:** single text field + send button, placeholder adapts to mode
- **Disclaimer:** "For self-reflection and entertainment. Not a substitute for professional advice." (keep — GDPR/ASA compliant)

---

## 4. UX principles (apply to every interaction)

1. **Jehana talks, she doesn't display** — every message streams, even the intro. She's a conversation, not an article.
2. **Show your work** — hook questions show their chart-basis parenthetical; RAG sources are collapsible-but-present. The transparency *is* the moat.
3. **Never hard-wall** — free tier exhaustion → downgrade to Echo mode, not a paywall wall. The user stays in conversation.
4. **The chart is the hero** — the Big Three reveal is the "wow" moment. Animate it. Make it feel sacred, not clinical.
5. **Privacy is brand** — "Your birth data is sacred" appears at data entry and in the footer. It's not legal copy, it's a value proposition.
6. **One product, two modes** — no separate `/echo` and `/advisor`. One `/jehana`, mode-switchable. Reduces cognitive load, increases perceived cohesion.
7. **Progressive disclosure** — onboarding asks only for birth date first (required). Time + place are optional with clear value hints ("deepens the reading", "improves accuracy"). Never ask for more than needed.
8. **Loading is content** — don't show a bare spinner. Show what Jehana is "doing" (calculating positions, reading houses, listening). Transforms wait into anticipation.

---

## 5. Migration plan (from current state)

### Phase A: Unify routes (1 day)
- Create `/jehana` that merges `/advisor`'s chat + `/echo`'s onboarding
- Redirect `/echo` → `/jehana`, `/advisor` → `/jehana`
- Update nav: header "Jehana" → `/jehana`, "Meet Jehana" CTA → `/jehana`
- Single chat component, mode-aware (Echo vs Deep Echo state)

### Phase B: Onboarding polish (1 day)
- Animate Big Three reveal (sequential fade-in + degree count-up)
- Stream Jehana intro (reuse `/api/chat` SSE path instead of `/api/echo` JSON)
- Add chart-basis parentheticals to hook buttons
- Progressive loading hints during chart calc

### Phase C: Chat refinements (0.5 day)
- Mode badge in header (Echo green / Deep Echo gold)
- In-chat upgrade message (not a separate Card)
- "Keep chatting in Echo mode" fallback after upgrade decline
- Gentle Echo → Deep Echo upsell after ~5 exchanges

### Phase D: Delete dead code (0.5 day)
- Remove `/echo` page (logic merged into `/jehana`)
- Remove `/advisor` page (logic merged into `/jehana`)
- Keep `/api/echo` (intro generation) + `/api/chat` (streaming) — both still used
- Update sitemap, header, footer, CTA links

**Total: ~3 days. No backend changes (both APIs stay). Pure frontend refactor + UX polish.**

---

## 6. What NOT to change (it works)

- **The chat streaming** (`/api/chat` SSE) — works well, RAG metadata + sources streamed first, content streamed after
- **The RAG sources panel** — collapsible, shows method (semantic/keyword), top score %, passage previews, attribution to C.A.Q. Libra 1917. World-class transparency.
- **The hook question concept** — chart-aware personalized questions are genuinely novel. Keep the mechanism.
- **The privacy framing** — "Your birth data is sacred. The cosmos gave it — we protect it." is brand-defining copy. Keep it everywhere birth data is collected.
- **The disclaimer** — "For self-reflection and entertainment. Not a substitute for professional advice." Required for ASA/GDPR compliance. Keep.
- **The 17-city dropdown** — covers Europe + MENA pilot markets. Keep (will become geo-search in a later phase).

---

## 7. Open decisions (for Issa)

- [ ] **Route name** — `/jehana` (person) vs `/chat` (function) vs keep `/advisor`? Recommendation: `/jehana` (brand the destination)
- [ ] **Echo mode limit** — currently unlimited free. Keep unlimited, or cap at N/day to drive Deep Echo upgrades? Recommendation: keep unlimited (Echo is the top-of-funnel, don't throttle it)
- [ ] **Deep Echo free count** — currently 3. Keep 3, or reduce to 1-2 for faster conversion? Recommendation: keep 3 (enough to feel the value, not so many they never upgrade)
- [ ] **Chart-basis parentheticals** — show them (transparency moat) or hide them (cleaner UI)? Recommendation: show them — it's the differentiator no competitor has
- [ ] **Animated chart reveal** — worth the engineering time, or ship static first? Recommendation: animate (it's the "wow" that drives screenshots/shares)
- [ ] **Progressive loading hints** — honest (they're fake-progress) or skip? Recommendation: keep — they measurably reduce bounce on slow connections, and they're aspirationally true (the chart calc does take ~3-5s)

---

## 8. Success metrics

| Metric | Current baseline | Target after UX unification |
|---|---|---|
| Onboarding completion (% who enter birth date → see Jehana intro) | unknown | >80% |
| Hook-question engagement (% who click at least 1 hook) | unknown | >60% |
| Free → paid conversion (Deep Echo 3-exhausted → upgrade) | unknown | >5% |
| Chat return rate (% who come back within 7 days) | unknown | >30% |
| Time-to-first-message (landing → first Jehana response) | unknown | <60s |

Instrument with Plausible events (privacy-first, no cookies): `jehana_start`, `jehana_intro_seen`, `jehana_hook_clicked`, `jehana_upgrade_shown`, `jehana_upgrade_clicked`.

---

## 9. RAG: both modes, not gated (clarification)

> **Decision confirmed with Issa, session 5:** RAG (book-grounded retrieval) is universal — both Echo and Deep Echo get it. It is NOT the paywall differentiator.

**The actual differentiator is chart depth:**

| | Echo Chat (free) | Deep Echo Chat (paid) |
|---|---|---|
| RAG (book passages retrieved) | ✅ gets it | ✅ gets it |
| Chart data available to AI | sun sign only | full chart (Sun, Moon, Rising, all 10 planets, 12 houses, aspects) |
| RAG query for chart-aware retrieval | ❌ no chart to query from | ✅ queries the book about *your specific placements* |
| Answer specificity | "Leos lead with warmth — the book says..." | "Your Sun in Leo in the 5th house, with Moon in Scorpio squaring Saturn — the book speaks to this tension..." |

**Why RAG stays universal:**
- RAG is the **brand moat** ("grounded in 1917 classical astrology, not hallucinated"). If free users get generic AI astrology, we lose the trust-building that makes them want to upgrade.
- Cost is negligible (~5ms vector search over 1,444 chunks, no gateway cost for retrieval — only the embed query which is already cached per-session).
- The premium value is **personalization** (chart-specific placements + book passages about those exact placements), not knowledge access.
- Gating RAG would make free tier *worse* without making paid tier *more valuable*.

**Future scale consideration:** if gateway embedding costs become significant at millions of queries, throttle Echo to *cached per-sign RAG* (pre-computed passages) vs Deep Echo to *live per-query RAG*. Not a product decision — a cost optimization for later.

---

## 10. Two-pass RAG (how Deep Echo grounds in your chart)

Deep Echo Chat does **two distinct RAG retrievals** — one for your chart, one per message:

### Pass 1: Chart-aware intro + hook generation (`src/lib/astrology/echo.ts:57`)

When you enter birth data, Jehana:
1. Calculates your natal chart (Moshier ephemeris → planets, houses, aspects)
2. Builds a RAG query from your **chart placements**: `"Cancer Sun Scorpio Moon Aquarius Rising Mars square Saturn personality character traits"`
3. Retrieves book passages about **those specific placements**
4. Generates her intro + 3 personalized hook questions **from those passages**

So Jehana's opening message isn't generic — it's grounded in what the 1917 book actually says about *your* chart. The hook questions are chart-derived: "How do you handle conflict? *(based on your Mars-Saturn square)*".

### Pass 2: Per-message retrieval (`src/app/api/chat/route.ts:76`)

Each time you send a message, Jehana:
1. Embeds your message text
2. Matches it against the 1,444 book chunks
3. Injects the retrieved passages as context before responding

So if you ask "why do I clash with my Virgo coworker?", she pulls book passages on Virgo compatibility, sign-pair tensions, etc.

### The full chain

```
Birth data → Moshier ephemeris → natal chart (planets, houses, aspects)
                                      ↓
                              Chart-aware RAG query (Pass 1)
                                      ↓
                        Book passages about YOUR placements
                                      ↓
                     Jehana intro + personalized hook questions
                                      ↓
                    [each chat message] → message RAG query (Pass 2)
                                      ↓
                    Book passages about your question
                                      ↓
                    Chart context + book context → Jehana response (streamed)
```

**Echo Chat does only Pass 2** (message-level RAG) — no chart to run Pass 1 on. So Echo gets book-grounded answers; Deep Echo gets book-grounded-**and**-chart-personalized answers. That's the upgrade value.

---

## 11. Cosmic Weather + Transit Interpretation

> **Discussed with Issa, session 5.** "Cosmic weather" = Jehana's framing for current planetary transits and how they affect *you specifically*. Today transits exist as a standalone `/transits` page; the plan brings them *into* the chat.

### 11.1 What exists today

| Feature | Where | State |
|---|---|---|
| Live planetary positions | `/transits` page, `/api/transits` | ✅ Works (Moshier real-time) |
| Transit calendar (Mercury retro, new/full moon, eclipses) | `/transits` page, `/api/transits/calendar`, `src/lib/astrology/astro-events.ts` | ✅ Works |
| Transit-to-natal aspects | `src/lib/astrology/transit-natal.ts`, used by horoscope generator | ✅ Works (math done, not exposed in chat) |
| Horoscopes with real transits baked in | `/horoscope`, `/personal`, `/api/horoscope/generate` | ✅ Works |
| Jehana transit awareness in chat | `/api/chat` system prompt (`src/lib/prompts.ts:146`): "When discussing transits, reference the user's natal placements to show how the transit hits THEM specifically" | ✅ Works (reactive — user must ask) |
| "Cosmic weather" mention | Jehana's Echo intro: "Ask me about your sign, transits, or the cosmic weather" | ✅ Copy only, no feature |

### 11.2 The gap

Transits are a **separate page** — users leave Jehana to see the cosmic weather. And Jehana's transit interpretation is **reactive** (user must ask) — she never *proactively* tells you a transit is hitting your chart.

### 11.3 Three-level transit interpretation (the vision)

All three levels use the **same backend** (transit-to-natal math + RAG + Jehana prompt). No new backend — only frontend + prompt + scheduling.

#### Level 1: Cosmic Weather card (in-chat, passive)

A collapsible card above the chat input, showing today's key transits with chart-aware annotations.

**Echo mode** (no chart — generic):
```
☁ Cosmic Weather — Aug 27
Mercury Rx begins Sep 2 · Full Moon in Pisces Sep 7 · Mars enters Scorpio Oct 11
```

**Deep Echo mode** (your chart — personal):
```
☁ Cosmic Weather — Aug 27
⚠ Mars square your natal Sun — intensity week (exact Friday, orb 3°)
◐ Full Moon in Pisces Sep 7 — lights your 7th house (relationships)
℞ Mercury Rx Sep 2-26 — retraces your 4th house (home, family)
[Ask Jehana about any of these →]
```

- Tap any line → pre-fills the chat input with a question about that transit
- Collapsible (default open for Deep Echo, collapsed for Echo)
- Updates daily (cached, not recalculated per render)
- **Free for both modes** (Echo generic, Deep Echo personal)

#### Level 2: Transit alerts (push/email, proactive)

Before a major transit exacts against the user's natal chart, Jehana sends a one-paragraph personalized reading.

```
Subject: Mars is squaring your Sun tomorrow, [Name]

Tomorrow (Fri Aug 30), Mars at 14° Scorpio squares your natal Sun at
11° Leo. The book calls this a "trial by fire" — a week of asserting
yourself when the path resists. With your Leo warmth, the challenge is
not whether you'll fight, but whether you'll fight the right battle.

Read more from Jehana →
```

- Triggered by `generatePersonalTransitCalendar` (already exists in `src/lib/astrology/astro-events.ts:346`)
- Sent via email (Resend) or web push (if PWA push is set up)
- **Deep Echo (paid) only** — the personalization requires chart data + premium tier
- User can toggle alert types in account settings (retrogrades, full moons, hard aspects to personal planets, etc.)

#### Level 3: Weekly transit reading (AI-generated, cached)

A 3-paragraph personalized weekly forecast, generated like a horoscope but transit-focused:

```
This Week for You — Aug 27 to Sep 2

Mars squares your natal Sun on Friday — the book speaks of "friction
that forges." You may feel provoked to assert yourself, particularly in
your career (Mars in your 10th house). Don't suppress the fire, but
choose your battles — a square demands action, not reaction.

Mercury begins its retrograde on Sep 2, retracing your 4th house of
home and family. Expect old conversations to resurface. The book
advises: "when Mercury turns back, turn back with it — review, don't
rush." This is a week to reconnect with where you come from.

The Full Moon in Pisces on Sep 7 lights your 7th house of
partnerships. If something has been building in a relationship, it
reaches clarity now. Trust what the moon illuminates — it won't show
you anything that isn't already there.
```

- Generated weekly via cron (like horoscopes, but transit-to-natal focused)
- Cached in `horoscopes` table (scope: `weekly_transit`)
- **Deep Echo (paid) only** — delivered in chat as a Monday-morning message + in account
- Uses the same pipeline: transit-to-natal math → RAG → Jehana prompt → stream/cache

### 11.4 The mechanism (shared across all 3 levels)

```
Current planetary positions (Moshier ephemeris, real-time)
        ↓
Transit-to-natal aspect calculator (src/lib/astrology/transit-natal.ts)
   "Mars at 14° Scorpio squares natal Sun at 11° Leo — orb 3°, exact Friday"
        ↓
RAG retrieval (book passages on Mars square Sun, on Scorpio-Leo tension)
        ↓
Jehana interprets it for THIS user:
   "Mars is heating up your 10th house of career this week. With your
    Leo Sun, this could feel like a push to assert yourself publicly —
    but the square means friction, not flow..."
```

All components exist. The work is: (1) frontend card in chat, (2) scheduling for alerts/weekly, (3) prompt templates for transit readings, (4) email/push integration.

### 11.5 The UX moat

**No competitor does this.** Co-Star sends blunt notifications ("Mercury retrograde. Be careful.") — generic, anxiety-inducing, not personal. Astro.com shows *your* transits in a dense table you interpret yourself. CHANI sends human-written transit posts (not chart-specific, just sign-specific).

**Jehana combines:** real ephemeris + your natal chart + 1917 book RAG + conversational AI. She tells you what the sky is doing, what it means for *your* chart specifically, and does it as a conversation — not a table, not a push notification, not a generic sign column. The transit-to-natal math + book RAG + chart context is the uncopyable stack.

---

## 12. Updated migration plan (with transit features)

### Phase A: Unify routes (1 day)
- Create `/jehana` merging `/advisor` chat + `/echo` onboarding
- Redirect `/echo` → `/jehana`, `/advisor` → `/jehana`
- Update nav, CTA, sitemap
- Single chat component, mode-aware

### Phase B: Onboarding polish (1 day)
- Animate Big Three reveal (sequential fade-in + degree count-up)
- Stream Jehana intro (reuse `/api/chat` SSE)
- Chart-basis parentheticals on hook buttons
- Progressive loading hints

### Phase C: Chat refinements + Cosmic Weather card (1 day)
- Mode badge in header
- In-chat upgrade message + Echo fallback
- **Cosmic Weather card** above input (Level 1 transit interpretation)
  - Echo: generic current transits
  - Deep Echo: chart-aware annotations ("Mars square your natal Sun")
  - Tap-to-ask: pre-fills chat input about that transit
  - Cached daily

### Phase D: Weekly transit reading + delete dead code (1 day)
- **Weekly transit reading** (Level 3) — generated via cron, cached, delivered in-chat Monday morning
- Prompt template for transit-focused reading
- Remove `/echo` + `/advisor` pages (logic merged)
- Update sitemap, header, footer

### Phase E (future, after auth + push): Transit alerts (1-2 days)
- **Transit alerts** (Level 2) — email via Resend, or web push
- User alert preferences in account settings
- Triggered by `generatePersonalTransitCalendar`
- Requires: Supabase Auth (for user identity) + email/push setup

**Total Phase A-D: ~4 days. Phase E deferred until auth + push infrastructure.**

---

## 13. Updated success metrics

| Metric | Current baseline | Target |
|---|---|---|
| Onboarding completion (birth date → intro seen) | unknown | >80% |
| Hook-question engagement (% click ≥1 hook) | unknown | >60% |
| Free → paid conversion (3-exhausted → upgrade) | unknown | >5% |
| Chat return rate (7-day) | unknown | >30% |
| Time-to-first-message (landing → first Jehana response) | unknown | <60s |
| **Cosmic Weather card engagement (% open it)** | new | >40% |
| **Tap-to-ask from weather card (% tap a transit)** | new | >25% |
| **Weekly transit reading open rate (paid)** | new | >50% |

Plausible events: `jehana_start`, `jehana_intro_seen`, `jehana_hook_clicked`, `jehana_upgrade_shown`, `jehana_upgrade_clicked`, `cosmic_weather_opened`, `cosmic_weather_tapped`, `weekly_transit_opened`.

---

## 14. Updated open decisions (for Issa)

- [ ] **Route name** — `/jehana` (brand the destination) vs `/chat` (function) vs keep `/advisor`? **Recommendation: `/jehana`**
- [ ] **Echo mode limit** — keep unlimited free? **Recommendation: keep unlimited** (Echo is top-of-funnel, don't throttle)
- [ ] **Deep Echo free count** — 3 questions? **Recommendation: keep 3** (enough to feel value, not so many they never upgrade)
- [ ] **Chart-basis parentheticals on hooks** — show them (transparency moat)? **Recommendation: show**
- [ ] **Animated chart reveal** — ship in Phase B? **Recommendation: yes** (it's the "wow" that drives shares)
- [ ] **Progressive loading hints** — keep (fake-progress)? **Recommendation: keep** (reduces bounce)
- [x] **RAG for both modes** — confirmed: RAG universal, chart depth is the differentiator (decided session 5)
- [ ] **Cosmic Weather card default state** — open for Deep Echo / collapsed for Echo? **Recommendation: yes** (personal transits are interesting; generic ones are noise)
- [ ] **Weekly transit reading delivery** — in-chat Monday message vs email vs both? **Recommendation: in-chat first** (no email infra needed), add email in Phase E
- [ ] **Transit alert granularity** — which transits trigger alerts? **Recommendation: hard aspects (square, opposition, conjunction) to Sun, Moon, Ascendant only** (personal planets), not all 10 planets (would be too noisy)

---

## Next step

Review this plan. Key questions:
1. **Route name** — `/jehana`, `/chat`, or keep `/advisor`?
2. **Scope** — do all 4 phases (A-D, ~4 days) or just Phase A (unify routes, 1 day)?
3. **Animated reveal** — ship it in Phase B or defer?
4. **Cosmic Weather card** — Phase C or defer?
5. **Ready to start?**

Reply "approved" to begin, or tell me what to change.