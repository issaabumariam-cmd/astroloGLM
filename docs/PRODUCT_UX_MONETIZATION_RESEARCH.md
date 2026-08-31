# Astrolo — World-Class Product, UX & Monetization Research Report

## 2026-08-28

> **Methodology:** Competitor research (8 astrology apps + 4 adjacent AI/wellness products), analysis of current Astrolo implementation, cross-reference with JEHANA_PRODUCT_UX_COMMERCIAL_RESEARCH_BRIEF.md, and behavioral product design principles.
>
> **Labels used:** FACT (sourced), ESTIMATE (third-party), OBSERVATION (visible in product), HYPOTHESIS (our interpretation), RECOMMENDATION (what we should do).

---

## 1. Executive Verdict

**VALIDATED: Jehana should become the consumer product. Astrology is the intelligence underneath.**

The competitor research confirms what the brief hypothesized. Every successful astrology product leads with a *relationship* to the user, not a feature list:
- Co-Star: "hyper-personalized, real-time" → your daily companion
- CHANI: "radical self-acceptance" → your spiritual guide
- The Pattern: "understand yourself" → your personality decoder
- AstroTalk: "talk to an astrologer now" → your advisor

None of them lead with "here are our features: horoscopes, charts, compatibility, transits." They lead with the *outcome* the user gets. Astrolo currently leads with features. This should change.

**But: the product is not greenfield.** We already have a working, tested, deployed system with 81 routes, anonymous auth, RAG, streaming chat, guided reading, and 94 E2E tests. The path forward is *evolution*, not rebuild.

---

## 2. Competitive Landscape — Key Findings

### What the market does (FACT)

| Dimension | Market norm | Astrolo today | Gap |
|---|---|---|---|
| **Core promise** | Relationship ("your companion/guide/advisor") | Features ("comprehensive astrology website") | Positioning gap |
| **First CTA** | One action ("download" / "get your chart" / "start chatting") | Multiple CTAs (Meet Jehana + Calculate Chart + daily horoscope + 12 signs + 6 features) | Cognitive overload |
| **Signup timing** | Mixed — Co-Star/AstroMatrix after value, The Pattern/Sanctuary before | After value (anonymous auth) ✅ | Already aligned with best practice |
| **Birth-data friction** | Full natal (date+time+place) required by all serious apps | Geo-search + date + optional time ✅ | Already best-in-class (Nominatim > dropdown) |
| **Aha moment** | Co-Star: notification that feels true. Pattern: personality trait that feels recognized. Replika: memory recall. | Chart reveal + chart-driven hook questions | Strong but not yet the *first* thing |
| **Retention loop** | Daily push (Co-Star), streaks (Calm), proactive messages (Replika), transit updates (Pattern) | None — no daily hook, no push, no "come back" mechanism | **Critical gap** |
| **Monetization** | Subscription $8-15/mo (Co-Star, CHANI, Pattern), credits/min (Sanctuary, AstroTalk), hybrid (Nebula) | £5.99/mo planned, 3 free Deep Echo questions | Aligned with market |
| **Paywall** | Soft (Co-Star, CHANI) to hard (Pattern, Sanctuary) | Soft — 3 free then upgrade, Echo unlimited | Well-designed |
| **Sharing** | Co-Star: notification screenshots. AstroTalk: predictions. | No share mechanic | Opportunity |
| **Explainability** | Astro.com: dense tables. Others: none. | RAG sources panel + chart-basis parentheticals | **Already ahead of market** |

### The unclaimed white space (HYPOTHESIS)

No competitor combines:
1. **Real astronomical calculation** (Moshier/Swiss Ephemeris)
2. **Book-grounded RAG** (1,444 passages from a classical text)
3. **Conversational AI** (streaming, multi-turn, chart-aware)
4. **Explainable reasoning** ("Why Jehana sees this" — expandable evidence)
5. **Guided reflection** (your chart asks *you* questions)

This is the stack. No single competitor has all five. The closest is CHANI (expert-written content + tools + rituals) but CHANI has no AI, no RAG, no real-time conversation. The closest AI product is The Pattern's "In-Depth" chat, but it uses generic AI with no astrology knowledge base.

**RECOMMENDATION:** Position Astrolo as the only product where astrology *explains itself* — every insight has a reason you can see. This is the moat.

---

## 3. Consumer Proposition

### Current positioning (OBSERVATION)
> "The cosmos, echoed back. Meet Jehana — your astrological guide."

This is poetic but vague. It doesn't tell a first-time visitor *what they'll get* or *why they should care*.

### Recommended positioning (RECOMMENDATION)
> **"Jehana is your personal astrologer. She reads your chart, explains what she sees, and talks with you about your life."**

Then two paths:
- **"Let Jehana guide you"** — she reads your chart and asks you questions
- **"Ask Jehana anything"** — you bring what matters to you

Supporting proof points (below the fold):
- **Real chart. Real astronomy.** Not generic sun-sign horoscopes.
- **She shows her work.** Every insight has a reason you can expand.
- **Grounded in classical wisdom.** Not invented — sourced from 1917 classical text.

---

## 4. Ideal First-Time Journey

### Current flow
Landing → many CTAs → pick a feature → maybe reach Jehana → 3 mode cards → choose → onboarding → chat

### Recommended flow (RECOMMENDATION)

```
Landing (one CTA: "Meet Jehana")
  ↓
Birth data (date + time + place — geo-search)
  ↓
Chart reveal (Sun → Moon → Rising, animated)
  ↓
"Jehana found 3 patterns in your chart."
  ↓
Guided question 1 (chart-driven, with chart-basis)
  ↓
User answers
  ↓
Jehana responds (streaming, book-grounded, with expandable "why")
  ↓
"You can go deeper, or ask Jehana anything."
  ↓
[Go deeper] or [Ask your own question]
  ↓
After 2-3 exchanges:
"Save your reading and continue anytime →"
  ↓
Signup (anonymous → account — "save your chart + conversations")
```

### Key differences from current:
1. **No mode selection screen** — start with Guided (Jehana leads), transition to Ask (user leads) naturally
2. **"3 patterns" framing** — the hook questions become "patterns Jehana found," not "questions"
3. **Signup after value** — after 2-3 meaningful exchanges, not before
4. **One CTA on landing** — "Meet Jehana," not a feature menu

### Why this works (HYPOTHESIS)
- **Reduces decision paralysis:** 3 mode cards → 0 choices before starting
- **Guided-first for new users:** they don't know what to ask → Jehana leads
- **Natural transition to Ask:** after experiencing guided, users learn what's possible and start asking their own questions
- **Signup feels like saving, not registering:** after 2-3 personal exchanges, the user *wants* to preserve the relationship

---

## 5. Returning-User Journey

### Current flow
Return → /jehana → "Welcome back" → pick a mode again → onboarding again (pre-filled)

### Recommended flow (RECOMMENDATION)

```
Return to astrolo.app
  ↓
"Welcome back. Here's what stands out today."
  ↓
TODAY view:
  - Strongest current influence (transit-to-natal)
  - Career / Relationships / Energy summary
  - "Ask Jehana about this →"
  ↓
Jehana opens in chat mode (not guided — returning users know what to ask)
  ↓
Cosmic Weather card (chart-aware transits)
  ↓
If user has no question → suggestion chips based on current transits
  ↓
If user has a question → just type it
```

### Key differences:
1. **No mode selection for returning users** — go straight to "Today" then chat
2. **"Today" is the retention hook** — "what stands out today?" gives a reason to return
3. **Transit-based suggestions** — not generic, based on what's actually happening in their chart right now

---

## 6. Information Architecture

### Current nav (OBSERVATION)
```
Jehana | Horoscope | Personal | Signs | Compatibility | Birth Chart | Transits | Library
```
8 items, feature-oriented. Communicates "astrology portal."

### Recommended nav — signed out (RECOMMENDATION)
```
Meet Jehana
```
One CTA. Everything else is SEO content accessible via footer/search.

### Recommended nav — signed in (RECOMMENDATION)
```
Today | Jehana | Timeline | Relationships
```
4 items, need-oriented. Each answers a question:
- **Today:** "What matters in my chart right now?"
- **Jehana:** "Talk about my life."
- **Timeline:** "What's coming?"
- **Relationships:** "Understand another person."

Everything else (birth chart, transits, book, signs, horoscopes) moves to:
- **Profile/settings** (birth chart, account)
- **SEO content** (signs, horoscopes, book) — accessible but not primary nav
- **Jehana-embedded** (transits appear as Cosmic Weather card in chat)

### Implementation priority:
1. **Phase 1:** Simplify homepage to one CTA + rename modes (low effort)
2. **Phase 2:** Build "Today" page (medium effort — transit-to-natal summary already exists in backend)
3. **Phase 3:** Build "Timeline" page (high effort — needs progression/return calculations)
4. **Phase 4:** Restructure nav when "Today" and "Timeline" exist

---

## 7. Guided Jehana UX — "Interactive Personal Reading" (NOT chat)

### Current (OBSERVATION)
Guided Reading is a chat-like flow with stages. It works but looks like chat with extra steps.

### Recommended (RECOMMENDATION)

**Guided should feel like a reading, not a chat.** Key differences from Ask:

| Aspect | Guided ("Let Jehana guide you") | Ask ("Ask Jehana anything") |
|---|---|---|
| Layout | Full-screen, one thing at a time | Chat interface, scrollable history |
| Typography | Larger (18-20px body), serif headings | Standard (14-16px body) |
| Input | "Reflect" button + textarea (not "Send") | Text input + Send button |
| History | Not visible — each question replaces previous | Visible — full conversation history |
| Pacing | Deliberate — pauses, "Jehana is reading your chart..." | Immediate — streaming response |
| Chart | Subtle — small glyph in corner | Explicit — RAG sources panel, chart context |
| Ending | "Your reading is complete. Save it?" | No ending — ongoing conversation |
| Sharing | "Share your reading" (generated summary card) | Not shareable (personal conversation) |

### Why two interfaces (HYPOTHESIS)
- **Guided = ceremony.** A reading is a ritual, not a chat. Different typography, pacing, and layout make it *feel* different — more intimate, more deliberate.
- **Ask = convenience.** When you have a question, you want an answer quickly. Chat is the right metaphor.
- **Emotional differentiation:** Guided feels like a therapy session. Ask feels like texting a smart friend. Both are valuable, but they're different *emotional products*.

### Implementation (RECOMMENDATION)
Don't build two separate page components. Use the same `/jehana` route with a `mode` parameter that changes CSS + layout:
- `mode=guided` → full-screen reading layout
- `mode=ask` → chat layout
- Shared: auth, chart data, geo-search, RAG, streaming

---

## 8. "Why Jehana Sees This" — The Transparency Moat

### Current (OBSERVATION)
- Hook questions show chart-basis parentheticals ("based on your Mars-Saturn square")
- RAG sources panel is collapsible under each response
- Good but not consistently applied

### Recommended (RECOMMENDATION)

**Every important insight should have an expandable "Why Jehana sees this" section.** Not always visible — collapsible, like the RAG panel but more structured:

```
Jehana: "This may be an important career period for you."

  ┌─ Why Jehana sees this ──────────────────────┐
  │                                              │
  │  Jupiter △ Midheaven                         │
  │  Orb: 0°41, applying                         │
  │  Strength: High                              │
  │                                              │
  │  Saturn introduces constraint                │
  │  Orb: 3°12, separating                       │
  │  Strength: Moderate                          │
  │                                              │
  │  2 independent factors reinforce this theme. │
  │                                              │
  │  Source: C.A.Q. Libra (1917), ch. 12         │
  │  "Jupiter favorable to the Midheaven..."     │
  │                                              │
  └──────────────────────────────────────────────┘
```

### Trust ladder (from the brief, §37)
- Level 1: "Career emphasis" (what most apps give)
- Level 2: "Jupiter activating your Midheaven" (Astro.com)
- Level 3: "Jupiter trine Midheaven, 0°41 orb" (Astro.com pro)
- Level 4: "3 factors reinforce this" (what we should show)
- Level 5: "Here's the historical source" (our RAG — unique)

**Default: Level 2. Expandable to Level 4-5.** The user sees a human explanation, can drill into evidence if they want. This is the transparency moat — no competitor does this.

---

## 9. Acquisition Strategy

### SEO content as funnel (RECOMMENDATION)
Keep all existing content pages (horoscopes, sign profiles, book) but:
1. Each page gets a **"Ask Jehana about this"** CTA at the bottom
2. Sign profile pages → "Want to know what [sign] means in *your* full chart? Ask Jehana →"
3. Horoscope pages → "This is your sun-sign horoscope. Want a personalized one based on your full chart? →"
4. Book chapters → "Want to discuss this with Jehana? →"

This converts SEO traffic into Jehana users without removing the SEO content.

### Compatibility as viral funnel (RECOMMENDATION)
- Keep the current compatibility page (sun-sign based, free, no login)
- Add share mechanic: "We're 84% compatible — check yours" with a link
- Each compatibility result → "There's one pattern that explains where you clash most. Ask Jehana about us →"
- Premium: full synastry (two complete charts) with Jehana deep reading

### Homepage (RECOMMENDATION)
Simplify to:
```
        Meet Jehana

  Your personal astrologer.
  She reads your chart, explains what she sees,
  and talks with you about your life.

  [Meet Jehana — Free]

  Let Jehana guide you  |  Ask Jehana anything

  ───────

  Real chart. Real astronomy.
  She shows her work.
  Grounded in classical wisdom.
```

No feature grid. No 12-sign selector. No daily horoscope preview. One proposition, one CTA.

---

## 10. Retention Model — "Why Return Tomorrow?"

### The problem (FACT)
The #1 risk in the brief: "building an impressive product people use once." This is the astrology app industry's core failure mode. Co-Star solves it with daily push notifications. Calm solves it with streaks. Replika solves it with proactive messages.

### Current Astrolo (OBSERVATION)
No retention mechanism. No push, no email, no "today" view, no reason to return after the first chart reading.

### Recommended retention stack (RECOMMENDATION)

| Mechanism | What | Priority | Effort |
|---|---|---|---|
| **"Today" page** | Personalized daily summary: strongest transit, career/relationship/energy, "ask Jehana about this" | P0 | Medium |
| **Cosmic Weather in chat** | Already built — chart-aware transits visible in every chat session | ✅ Done | — |
| **Email nudge** | "A career-focused period becomes stronger this week — read what Jehana says" | P1 | Low (Resend) |
| **Web push** | "Mercury enters your 7th house tomorrow" (PWA push, no app store) | P1 | Medium |
| **Conversation memory** | "Last month you asked about a career change — is that still active?" | P2 | High |
| **Outcome check-in** | "How was this week for you?" (in-conversation, not a rating) | P2 | Low |
| **Weekly transit reading** | Already prompted — Monday morning in-chat message | ✅ Prompt ready | Cron + cache |

### The retention loop (HYPOTHESIS)
```
Day 1: Chart reveal + guided reading (wow)
Day 2: "Today" shows a transit → Ask Jehana about it
Day 7: Weekly transit reading arrives in chat
Day 14: "Last week you asked about X — here's an update"
Day 30: "This month's theme is Y — want to explore?"
```

The loop is: **cosmic conditions change → Jehana notices → tells you → you engage → she remembers → next time she references it.** This is the Replika pattern applied to astrology — and no competitor does it.

---

## 11. Monetization

### Market pricing (FACT)
| Product | Monthly | Annual | Model |
|---|---|---|---|
| Co-Star | ~$9.99 | ~$69.99 | Subscription + reports |
| CHANI | ~$9.99 | — | Subscription + physical shop |
| The Pattern | ~$7.99-11.99 | — | Subscription |
| Nebula | Varies | — | Subscription + credits |
| Calm | ~$14.99 | ~$69.99 | Subscription + B2B |
| Headspace | ~$12.99 | ~$69.99 | Subscription + B2B + therapy |

### Recommended pricing (RECOMMENDATION)

| Tier | Price | What you get |
|---|---|---|
| **Free** | £0 | Initial chart, Big Three, 1 guided reading (3 questions + 1 follow-up each), Echo Chat (sun-sign, unlimited), quick compatibility, all SEO content |
| **Premium** | £5.99/mo or £49/yr | Unlimited Deep Echo, full chart conversations, "Today" personalized daily, weekly transit readings, unlimited guided readings, memory (Jehana remembers), Cosmic Weather (chart-aware), deep compatibility |
| **Reports** (future) | £14.99-19.99 one-off | Annual outlook, deep relationship reading, solar return, career reading |

### Why this pricing (HYPOTHESIS)
- **£5.99/mo** is at the low end of the market ($7.99-14.99) — appropriate for a new product without brand recognition
- **£49/yr** gives ~30% discount vs monthly — drives annual conversions (reduces churn)
- **Free tier is generous** — Echo Chat unlimited + 1 guided reading + quick compatibility = enough to experience the product deeply
- **Premium value is depth** — unlimited conversations + memory + timing + chart-aware everything
- **Reports** capture one-off buyers who won't subscribe (the Astro.com model)

### LLM cost per user (ESTIMATE)
- Deep Echo: ~2K tokens/conversation × 10 convos/month = 20K tokens
- Gateway cost: ~€0.10-0.50/user/month (depends on pricing model)
- At £5.99/mo, margin is comfortable
- Free tier: Echo Chat uses RAG but no chart context → cheaper; 1 guided reading = one-time cost

---

## 12. Prioritized Roadmap

### Phase 1 — Positioning + Simplification (2-3 days, high impact, low effort)
1. **Simplify homepage** → one CTA ("Meet Jehana"), remove feature grid
2. **Rename modes** → "Let Jehana guide you" / "Ask Jehana anything" (remove Echo/Deep Echo terminology)
3. **Remove mode selection for first-time users** → start with Guided automatically after birth data
4. **Add "Ask Jehana about this" CTAs** to all SEO content pages (signs, horoscopes, book)
5. **Add share mechanic to compatibility** → "We're X% compatible — check yours"
6. **Positioning copy** → "Your personal astrologer. She reads your chart, explains what she sees, and talks with you about your life."

### Phase 2 — Retention (1 week, high impact, medium effort)
1. **Build "Today" page** → personalized daily summary (strongest transit, career/rel/energy, "ask Jehana")
2. **Weekly transit reading** → cron job, cached, Monday morning in-chat message (prompt already written)
3. **Email nudge** → weekly "what's active in your chart" email via Resend (optional, not push)
4. **Returning user flow** → skip mode selection, go to "Today" → chat
5. **Signed-in nav** → Today | Jehana | Timeline | Relationships (Timeline can be "coming soon")

### Phase 3 — Trust + Depth (1-2 weeks, medium impact, medium effort)
1. **"Why Jehana sees this" panel** → structured expandable evidence under insights
2. **Guided interface differentiation** → larger type, "reflect" not "send", no chat history, reading feel
3. **Conversation memory** → Jehana references past conversations ("last time you asked about...")
4. **Outcome check-in** → "How was this week for you?" in conversation (not a rating system)

### Phase 4 — Scale (ongoing)
1. **Timeline page** → monthly themes, upcoming periods, "what's approaching"
2. **Swiss Ephemeris** → if extreme-latitude accuracy matters for EU market
3. **[locale] i18n** → German first, then French, Spanish, Italian
4. **Stripe payment** → wire the subscription (checkout already built)
5. **Deep compatibility** → full synastry with Jehana reading
6. **Referral mechanic** → "Share your reading" generates a unique link

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **People use once, don't return** | Critical | "Today" page + weekly email + transit-based chat suggestions |
| **LLM cost scales faster than revenue** | High | Free tier uses cheaper Echo (no chart context); gate Deep Echo to 3 free |
| **Swiss Ephemeris accuracy at high latitudes** | Medium | Moshier verified for natal charts; validate at 60°N+ before deciding |
| **"AI astrology" perception damages credibility** | Medium | Never say "AI" in user-facing copy. Say "Jehana reads your chart." Explainability panel shows real astronomy. |
| **Competitor copies the explainability moat** | Low | RAG on a specific 1917 text is hard to replicate; rule engine would be even harder |
| **Browser cache on old URLs** | Low | 308 redirects deployed; will resolve as caches expire |
| **Anonymous auth creates orphan accounts** | Low | Supabase handles this; anonymous → registered conversion preserves data |

---

## 14. Measurement Framework

### Funnel events (RECOMMENDATION — instrument with Plausible, privacy-first)

| Event | When | What it measures |
|---|---|---|
| `landing_view` | Homepage loaded | Acquisition |
| `jehana_start` | Clicked "Meet Jehana" | Activation step 1 |
| `birth_data_submitted` | Birth form completed | Activation step 2 |
| `chart_reveal_seen` | Big Three animated | Aha moment |
| `guided_q1_answered` | First hook answered | Engagement |
| `first_jehana_response` | First streaming response received | Value delivery |
| `guided_complete` | All 3 hooks done | Activation complete |
| `ask_first_question` | User types their own question | Transition to chat |
| `signup_prompted` | "Save your reading" shown | Conversion step 1 |
| `signup_completed` | Account created | Conversion step 2 |
| `return_d1` | Came back next day | D1 retention |
| `return_d7` | Came back within 7 days | D7 retention |
| `today_viewed` | "Today" page opened | Retention engagement |
| `upgrade_shown` | Paywall/sheet shown | Monetization step 1 |
| `upgrade_clicked` | Clicked "Unlock Deep Echo" | Monetization step 2 |
| `subscription_active` | Stripe confirms payment | Monetization complete |
| `compatibility_shared` | Shared compatibility link | Viral coefficient |
| `reading_shared` | Shared guided reading summary | Viral coefficient |

### Key metrics (RECOMMENDATION)

| Metric | Target (3 months) | Benchmark |
|---|---|---|
| Landing → birth data submitted | >40% | Co-Star ~60% (app install), web likely lower |
| Birth data → first Jehana response | >80% | We control this (chart calc + LLM) |
| First response → signup | >30% | Replika ~40% (value-first model) |
| D1 retention | >40% | Calm ~50%, Co-Star ~45% (ESTIMATE) |
| D7 retention | >25% | Astrology apps average ~20% (ESTIMATE) |
| D30 retention | >15% | Astrology apps average ~10% (ESTIMATE) |
| Free → paid conversion | >5% | Subscription apps average 2-8% |
| Monthly churn | <10% | Subscription apps average 5-15% |
| ARPPU | £5.99/mo or £49/yr | Market median ~$8-10/mo |

---

## 15. What I Disagree With in the Brief

### "Structured rule engine for astrology reasoning" (§40) — NOT RECOMMENDED (yet)
Building a rule engine means *choosing a school* and encoding its rules. Astrology rules are contested across schools. The current approach (chart facts → RAG → LLM reasoning) is more flexible and 80% as explainable. Build a rule engine only after user data shows which rules matter.

### "The signed-in product should become Today | Timeline | Jehana | Relationships" (§14) — PARTIALLY VALIDATED
Correct direction, but don't restructure nav until "Today" and "Timeline" are built. Premature nav restructuring creates dead links and confusion.

### "Outcome feedback: did this resonate?" (§27, §43) — NEEDS REFRAMING
Not a rating system. Make it conversational: Jehana asks "how was this week for you?" in the flow of conversation. No 1-5 stars, no "was this accurate?" — that implies prediction. "How did this resonate?" is self-reflection, not evaluation.

### "Swiss Ephemeris 14/20 accuracy warning" (§21) — STALE
The 14/20 was from the old `chart.ts` (equal-house). Current `placidus.ts` is verified: 4/4 ASC signs match, 5/5 symmetry, 5/5 monotonicity, 5/5 sun-house sane. The warning in the brief is based on outdated information.

---

## 16. Summary — The Path Forward

**The product thesis is correct:** Jehana is the product, astrology is the intelligence.

**The implementation path is evolution, not rebuild:**
1. Simplify the homepage (2 days)
2. Rename modes + remove terminology (1 day)
3. Build "Today" for retention (3 days)
4. Add "Why Jehana sees this" panel (2 days)
5. Wire email nudge + weekly transit (2 days)
6. Then measure, iterate, and build Timeline + memory

**The moat is explainability + guided reflection + book-grounded RAG.** No competitor has all three. The market has AI chat (Pattern), expert content (CHANI), and brutal notifications (Co-Star) — but nobody combines real astronomy + classical knowledge + conversational AI + transparent reasoning + guided self-reflection.

**The business risk is retention, not technology.** Fix it with "Today" + transit-based suggestions + conversation memory. The technology is ready; the *reason to return* is not.

**Start with Phase 1 (simplify + rename).** It's 2-3 days, low risk, high impact. Deploy, measure, then build Phase 2.