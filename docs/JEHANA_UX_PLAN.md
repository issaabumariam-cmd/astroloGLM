# Astrolo — Jehana Onboarding & Chat UX Plan

## v2 — 2026-08-27 (locked, replaces v1)

> **Status:** APPROVED by Issa, session 5. All six UX tensions decided. Ready for implementation.
> **v1 → v2 changes:** folded in the 6 UX-tension decisions (§15), added Phase A0 (auth), geo-search in A, mobile in C, errors throughout, updated phase plan (§16), updated "what NOT to change" (17-city dropdown → geo-search), corrected §2 table (RAG universal per §9).

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
| **RAG** | ✅ Universal (both modes — see §9) | ✅ Universal (both modes) |
| **Chart-aware RAG (Pass 1)** | ❌ no chart to query from | ✅ queries book about *your placements* (see §10) |
| **Cost tier** | Free, unlimited | Free 3 questions, then £5.99/mo |
| **Use case** | "I'm a Leo, what's my week?" | "How does my Moon in Scorpio affect my relationships?" |
| **Tone** | Warm, concise, sign-level | Warm, layered, chart-specific |

The **onboarding** (birth-data entry + chart preview + Jehana intro) is a **shared funnel** — both modes start the same way for a new user, but Echo Chat skips it (just pick a sign).

---

## 3. Proposed unified UX

### 3.1 Single entry point: `/jehana` (replaces both `/echo` and `/advisor`)

**Decision (§15.1): one route.** Two routes recreate the problem we're solving. The onboarding *stage* and chat *stage* live in the same page — first-timers see the funnel, returners skip to chat. This is how Pi (Inflection AI) does it — one entry, the AI adapts to where you are.

The `/echo` and `/advisor` routes redirect to `/jehana`.

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
        ├─ Free-tier counter (Deep Echo only: "2 free left", server-enforced)
        ├─ Streaming responses (both modes)
        ├─ RAG sources panel (both modes — RAG is universal per §9)
        ├─ Hook questions (Deep Echo only, first 3)
        ├─ Suggestions (Echo: per-sign; Deep Echo: chart-aware)
        ├─ Cosmic Weather card (above input — see §11)
        └─ Upgrade prompt (Deep Echo after 3; modal sheet — see §15.4)
```

### 3.2 Onboarding deep-dive (the "Meet Jehana" moment)

This is the highest-stakes UX — it's the first impression, the conversion driver, and the "wow" moment. Current `/echo` gets it right conceptually but the execution needs polish.

**The flow (Deep Echo onboarding):**

1. **Birth data entry** (current: works, enhance)
   - Date (required), time (**strongly encouraged** — see §15.3, skippable), **geo-search birthplace** (Nominatim autocomplete — see §15/gap-3, replaces 17-city dropdown)
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
   - **Enhance:** animated reveal — **Sun fades in first** (always accurate), ~400ms. Then:
     - **If birth time entered:** Moon → Rising fade in sequentially (~400ms apart), degrees count-up (0° → actual, ~600ms). Full reveal.
     - **If birth time omitted:** Sun stays. A gentle prompt from Jehana (in-character): "I can see your Sun in Cancer clearly. For your Moon and Rising — the parts that shape your inner world — I'd need your birth time. [Add time →] [Continue with Sun only →]" (see §15.3 — the curiosity hook)
   - This is the "wow" — the user *sees* their chart come alive, and the missing pieces create the *want* to provide time.

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
   - Free counter: "2 free questions remaining" (subtle, non-urgent, **server-enforced** per §15/gap-1)

7. **Upgrade moment** (current: after 2 exchanges, a Card paywall — **changed** per §15.4)
   - **Modal sheet, not in-chat bubble.** Jehana says the warm trigger line in-chat:
     > "I've loved reading the first pages of your chart with you. There are ten planets in twelve houses — each one a story. Would you like to go deeper?"
   - Then a **clean sheet slides up** with the offer (Jehana never asks for money — the app does, once, gently). This is the anti-Nebula pattern: the guide stays sacred, the transaction is a separate UI layer.
   - The "keep chatting in Echo mode" fallback is critical — don't hard-wall. The user drops to Echo (per-sign) chat, **new thread** (hard downgrade per §15.2), not out of the product.

### 3.3 Echo onboarding (lightweight)

For users who pick "I know my sign":

1. 12-sign picker grid (current: works, keep)
2. Canned intro: "Hi! I'm Jehana. I see you're a Leo — fire energy, ruled by the Sun. [personality excerpt]. Ask me anything about your sign, transits, or the cosmic weather." (current: works, keep)
3. Per-sign suggestions appear as side-buttons (current: works, keep)
4. No upgrade prompt (Echo is free, unlimited)
5. A gentle upsell after ~5 exchanges: "Want a reading based on your *full* birth chart? Try Deep Echo →" (non-blocking, dismissible)
6. **Soft upgrade** (§15.2): clicking "Try Deep Echo" enters birth data → Jehana says "now I can see your full chart" → **same thread deepens**, mode badge flips Echo → Deep Echo, free count starts.

### 3.4 The chat (unified)

Both modes converge into the same chat UI, mode-aware:

- **Header:** Jehana avatar (✦) + mode badge ("Echo" green / "Deep Echo" gold) + free counter (Deep Echo only, server-enforced) + "New Chat" button
- **Messages:** streaming bubbles, user right / Jehana left, same as current `/advisor` chat
- **RAG sources:** collapsible panel under each response — **both modes** (RAG universal per §9). Echo gets message-level RAG; Deep Echo gets chart-aware + message-level RAG.
- **Suggestions:** Echo = per-sign suggestions; Deep Echo = chart-aware hooks (first 3) then free-form
- **Cosmic Weather card:** above input (see §11), collapsible, mode-aware
- **Input:** single text field + send button, placeholder adapts to mode
- **Disclaimer:** "For self-reflection and entertainment. Not a substitute for professional advice." (keep — GDPR/ASA compliant)
- **Chat history:** device-local (localStorage) for both tiers — refresh doesn't lose the conversation. Cloud sync on signup (preserves readings across devices). Paid tier adds: unlimited cloud history, search, export. (§15.5)

---

## 4. UX principles (apply to every interaction)

1. **Jehana talks, she doesn't display** — every message streams, even the intro. She's a conversation, not an article.
2. **Show your work** — hook questions show their chart-basis parenthetical; RAG sources are collapsible-but-present. The transparency *is* the moat.
3. **Never hard-wall** — free tier exhaustion → downgrade to Echo mode (new thread), not a paywall wall. The user stays in conversation.
4. **The chart is the hero** — the Big Three reveal is the "wow" moment. Animate it. Make it feel sacred, not clinical.
5. **Privacy is brand** — "Your birth data is sacred" appears at data entry and in the footer. It's not legal copy, it's a value proposition.
6. **One product, two modes** — no separate `/echo` and `/advisor`. One `/jehana`, mode-switchable. Reduces cognitive load, increases perceived cohesion.
7. **Progressive disclosure** — onboarding asks only for birth date first (required). Time is strongly encouraged (the reveal creates the want) but skippable. Place via geo-search. Never ask for more than needed.
8. **Loading is content** — don't show a bare spinner. Show what Jehana is "doing" (calculating positions, reading houses, listening). Transforms wait into anticipation.
9. **Jehana never sells** — the guide stays sacred. Upgrades happen in a modal sheet, triggered by Jehana's warm words but executed by the app. The anti-Nebula pattern.
10. **Graceful degradation** — every failure (gateway down, RAG miss, chart error, partial stream) has a specific, in-character, actionable response. No bare "error" states. (§15/gap-5)

---

## 5. Migration plan (from current state) — superseded by §16

> See §16 for the locked, updated phase plan with auth (A0), geo-search, mobile, and all six gaps folded in.

---

## 6. What NOT to change (it works)

- **The chat streaming** (`/api/chat` SSE) — works well, RAG metadata + sources streamed first, content streamed after
- **The RAG sources panel** — collapsible, shows method (semantic/keyword), top score %, passage previews, attribution to C.A.Q. Libra 1917. World-class transparency.
- **The hook question concept** — chart-aware personalized questions are genuinely novel. Keep the mechanism.
- **The privacy framing** — "Your birth data is sacred. The cosmos gave it — we protect it." is brand-defining copy. Keep it everywhere birth data is collected.
- **The disclaimer** — "For self-reflection and entertainment. Not a substitute for professional advice." Required for ASA/GDPR compliance. Keep.
- ~~**The 17-city dropdown** — covers Europe + MENA pilot markets. Keep (will become geo-search in a later phase).~~ **CHANGED (§15/gap-3):** replaced by Nominatim geo-search autocomplete in Phase A. The 17-city dropdown is a credibility limitation (a user born in Manchester, Marseille, or Marrakech can't enter their actual birthplace). Geo-search is table stakes for a premium Europe+MENA product.

---

## 7. Open decisions (for Issa) — superseded by §15

> The original v1 open decisions are all resolved in §15 (the six UX tensions). See §15 for the locked calls.

---

## 8. Success metrics

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

Instrument with Plausible events (privacy-first, no cookies): `jehana_start`, `jehana_intro_seen`, `jehana_hook_clicked`, `jehana_upgrade_shown`, `jehana_upgrade_clicked`, `cosmic_weather_opened`, `cosmic_weather_tapped`, `weekly_transit_opened`.

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
- **Alert granularity:** hard aspects (square, opposition, conjunction) to Sun, Moon, Ascendant only — not all 10 planets (would be too noisy)

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

## 12. ~~Updated migration plan~~ — superseded by §16

> See §16 for the locked phase plan.

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
| **Birth-time add rate (% who add time after Sun-only reveal)** | new | >40% |
| **Returning-user skip-to-chat rate (returners who skip onboarding)** | new | >70% |

Plausible events: `jehana_start`, `jehana_intro_seen`, `jehana_hook_clicked`, `jehana_upgrade_shown`, `jehana_upgrade_clicked`, `cosmic_weather_opened`, `cosmic_weather_tapped`, `weekly_transit_opened`, `birth_time_added`.

---

## 14. ~~Updated open decisions~~ — superseded by §15

> All open decisions resolved in §15.

---

## 15. The six UX tensions (LOCKED — approved by Issa, session 5)

### 15.1 One route or two? → **One route (`/jehana`)**

Two routes recreate the exact problem we're solving. The onboarding *stage* and the chat *stage* live in the same page — first-timers see the funnel, returners skip to chat. This is how Pi (Inflection AI) does it — one entry, the AI adapts to where you are. Co-Star has one app, not a "meet Co-Star" page + a "chat with Co-Star" page. Splitting feels like two products; users smell fragmentation.

### 15.2 Switch modes mid-chat? → **Soft upgrade, hard downgrade**

This is how ChatGPT handles model switching — you can upgrade mid-conversation (GPT-4o takes over smoothly), but switching down is jarring so it starts fresh. For Jehana: an Echo user enters birth data → Jehana says "now I can see your full chart" → same thread deepens, mode badge flips. But if Deep Echo exhausts and drops to Echo, start a new thread — mixing chart-aware and sign-only responses in one scrollback is incoherent and would feel like Jehana "forgot" you.

### 15.3 Birth time? → **Strongly encouraged but skippable**

Co-Star requires it (hard wall — bad). The Pattern doesn't use time at all (avoids the issue — weaker). The world-class middle: make time feel *valuable*, not optional-but-fine. The reveal animation shows **Sun first** (always accurate), then if no time: "I can see your Sun in Cancer clearly. For your Moon and Rising — the parts that shape your inner world — I'd need your birth time. [Add time →] [Continue with Sun only →]". This converts the limitation into a **curiosity hook** — the user *wants* to give the time because they saw what they're missing, not because a form demanded it.

### 15.4 Upgrade moment? → **Modal sheet, triggered by Jehana's words**

Headspace, Calm, Audible all do this — the guide/voice *never sells*. The trigger is warm and in-character ("I've loved reading with you..."), then a clean sheet slides up with the offer. The chat stays sacred; the transaction is clearly a separate UI layer. An in-chat paywall bubble makes Jehana feel like a salesperson wearing a friend's mask — that's the trust-killer that killed Nebula (per MARKET_RESEARCH.md: "aggressive monetization, hidden costs, difficult cancellations"). We're the anti-Nebula. Jehana never asks for money; the app does, once, gently.

### 15.5 Chat history? → **Device-local for both, cloud sync after signup**

World-class apps don't gate *memory* behind paywalls — they gate *portability*. ChatGPT keeps free history device-local (and recent), syncs to cloud on login. For us: Echo and Deep Echo both save to localStorage (refresh doesn't lose the conversation — the #1 retention killer today). Cloud sync across devices is the **signup incentive**, not a paid feature — signing up preserves your readings on any device, and is required before payment anyway (Stripe needs an account). Paid tier then adds: unlimited cloud history, search, export. Free tier: last 30 days device-local.

### 15.6 The six gaps — all folded in (auth, returning-user, geo-search, voice, errors, mobile)

A plan that says "17-city dropdown, keep" while we've decided to build geo-search is a plan that lies to itself. World-class docs match reality. All six gaps are folded into the phase plan (§16):

- **Auth (gap 1)** → Phase A0 (prerequisite — without it, "premium" is theater). Supabase anonymous auth, server-enforced free count, birth data persistence.
- **Returning-user (gap 2)** → Phase A0 (same auth context — birth data persists, returners skip onboarding). Device-local → sync on signup.
- **Geo-search (gap 3)** → Phase A (credibility feature, not deferrable). Nominatim autocomplete replaces 17-city dropdown.
- **Voice across locales (gap 4)** → noted as a `[locale]` dependency, not a Jehana-phase item. Jehana speaks German natively (translated persona, not English-with-German-output). Female voice across all locales.
- **Error UX (gap 5)** → woven through all phases (not a separate phase — it's a standard). Specific, in-character, actionable responses for every failure.
- **Mobile (gap 6)** → dedicated pass in Phase C (chat is a different beast on 5.5": sticky input dvh, scroll-respect, collapsed weather card, enterKeyHint, pull-to-refresh disabled).

---

## 16. Locked phase plan (with all six gaps)

### Phase A0: Auth + persistence (1 day) — PREREQUISITE
- Supabase anonymous auth (zero friction — no email, no signup)
- Server-enforced free count: `/api/chat` checks `profiles.ai_questions_used >= ai_questions_limit` → 402 before LLM
- Birth data persists: `profiles.birth_date/time/place/lat/lng` populated on first Deep Echo onboarding
- Returning users skip onboarding → "Welcome back, your [Cancer Sun / Scorpio Moon] chart is ready. Continue?"
- Device-local chat history (localStorage) for both tiers — refresh doesn't lose conversation
- Cloud sync on signup (preserves readings + birth data across devices)
- Free count reset monthly (server-side `ai_questions_reset_at`)

### Phase A: Unify routes + geo-search (1 day)
- Create `/jehana` merging `/advisor` chat + `/echo` onboarding (one route per §15.1)
- Redirect `/echo` → `/jehana`, `/advisor` → `/jehana`
- **Geo-search birthplace** (Nominatim autocomplete) replaces 17-city dropdown in `/jehana` onboarding + `/personal` + `/birth-chart`
- Single chat component, mode-aware (Echo vs Deep Echo state)
- **Soft upgrade / hard downgrade** logic (§15.2): Echo → enter birth data → same thread deepens; Deep Echo exhausts → new Echo thread
- Update nav, CTA, sitemap

### Phase B: Onboarding polish (1 day)
- **Animated Big Three reveal** (§15.3): Sun first (always accurate), then Moon → Rising if time entered. If no time: curiosity hook ("I can see your Sun clearly. For Moon and Rising, I'd need your birth time. [Add time →] [Continue with Sun only →]")
- Stream Jehana intro (reuse `/api/chat` SSE path instead of `/api/echo` JSON)
- Chart-basis parentheticals on hook buttons ("based on your Mars-Saturn square")
- Progressive loading hints ("Calculating positions... Reading houses... Jehana is listening...")

### Phase C: Chat refinements + Cosmic Weather + mobile (1 day)
- Mode badge in header (Echo green / Deep Echo gold)
- **Modal-sheet upgrade** (§15.4): Jehana says warm trigger in-chat → clean sheet slides up with offer → "keep chatting in Echo" fallback → new thread (hard downgrade)
- **Cosmic Weather card** above input (Level 1 transit interpretation):
  - Echo: generic current transits (collapsed by default)
  - Deep Echo: chart-aware annotations ("Mars square your natal Sun") (open by default)
  - Tap-to-ask: pre-fills chat input about that transit
  - Cached daily
- Gentle Echo → Deep Echo upsell after ~5 exchanges
- **Mobile chat pass** (§15/gap-6): sticky input (dvh not vh), scroll-respect (don't yank on manual scroll-up), collapsed weather card on mobile, `enterKeyHint="send"`, pull-to-refresh disabled, tap targets ≥44px
- **Error/edge-case UX** (§15/gap-5) throughout:
  - Gateway down: "The cosmos seems busy" + retry button + preserve user message
  - Intro fails mid-stream: show chart reveal anyway + "Jehana will join shortly" + retry
  - RAG fails: subtle "responding from general knowledge (book unavailable)" tag
  - Chart calc fails: specific actionable error ("Birth time too close to a cusp — try ±15 min")
  - Partial stream: 30s no-token timeout → "Connection interrupted. [Retry]"
  - Birth time omitted: Jehana caveats in conversation ("your Moon in Scorpio — approximate without your time")

### Phase D: Weekly transit reading + delete dead code (0.5 day)
- **Weekly transit reading** (Level 3) — generated via cron, cached (`horoscopes` scope: `weekly_transit`), delivered in-chat Monday morning
- Prompt template for transit-focused reading (transit-to-natal math → RAG → Jehana prompt → cache)
- Remove `/echo` + `/advisor` pages (logic merged into `/jehana`)
- Keep `/api/echo` (intro generation) + `/api/chat` (streaming) — both still used
- Update sitemap, header, footer, CTA links

### Phase E (future, after auth + push infra): Transit alerts (1-2 days)
- **Transit alerts** (Level 2) — email via Resend, or web push
- User alert preferences in account settings
- Triggered by `generatePersonalTransitCalendar`
- Alert granularity: hard aspects (square, opposition, conjunction) to Sun, Moon, Ascendant only
- Requires: Supabase Auth (for user identity) + email/push setup

**Total Phase A0-D: ~4.5 days. Phase E deferred until auth + push infrastructure.**

---

## Next step

Plan is **LOCKED** (v2, approved by Issa session 5). Start implementation:
1. Phase A0: auth + persistence (prerequisite)
2. Phase A: unify routes + geo-search
3. Phase B: onboarding polish
4. Phase C: chat + cosmic weather + mobile
5. Phase D: weekly transit + cleanup