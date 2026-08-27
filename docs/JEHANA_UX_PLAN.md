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

## Next step

Review this plan. Key questions:
1. **Route name** — `/jehana`, `/chat`, or keep `/advisor`?
2. **Scope** — do all 4 phases (A-D, ~3 days) or just Phase A (unify routes, 1 day)?
3. **Animated reveal** — ship it in Phase B or defer?
4. **Ready to start?**

Reply "approved" to begin, or tell me what to change.