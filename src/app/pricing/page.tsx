import { Check, Sparkles, Crown, Shield } from "lucide-react";
import { Eyebrow, Card, OrnateDivider } from "@/components/shared/ui-primitives";

export const metadata = {
  title: "Premium",
  description: "Unlock unlimited Jehana, full birth chart interpretation, deep compatibility readings, and the complete astrology library.",
};

const freeFeatures = [
  "Daily horoscope for all 12 signs",
  "Birth chart calculation (Big Three)",
  "Personality profiles",
  "Compatibility scores",
  "3 Jehana questions per month",
  "Book sample chapters",
];

const premiumFeatures = [
  "Everything in Free, plus:",
  "Unlimited Jehana � your astrological guide",
  "Full birth chart interpretation",
  "Deep compatibility readings",
  "Weekly & monthly forecasts",
  "Complete astrology library access",
  "Transit calendar & alerts",
  "Journaling & wellness tools",
  "Ad-free experience",
  "Priority new features",
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 text-center">
        <Eyebrow>Plans</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          Continue the conversation.
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          The universe wrote your story. Free lets you peek. Premium lets you read every page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Free */}
        <Card className="p-8">
          <div className="mb-4">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Seeker</h2>
            <p className="text-sm text-foreground-muted">Free forever</p>
          </div>
          <p className="text-4xl font-serif font-semibold text-foreground">£0</p>
          <p className="text-xs text-foreground-subtle">No card required</p>
          <ul className="mt-6 space-y-3">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>
          <button className="btn-secondary mt-6 w-full">Get Started</button>
        </Card>

        {/* Premium */}
        <Card className="relative border-primary/30 p-8" >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1 text-xs font-medium text-surface">
              <Crown className="h-3 w-3" />
              Most Popular
            </span>
          </div>
          <div className="mb-4">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Astrologer</h2>
            <p className="text-sm text-foreground-muted">Full access</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-serif font-semibold text-foreground">£5.99</p>
            <p className="text-sm text-foreground-muted">/ month</p>
          </div>
          <p className="text-xs text-foreground-subtle">
            or £49/year <span className="text-success">(save 31%)</span>
          </p>
          <ul className="mt-6 space-y-3">
            {premiumFeatures.map((f, i) => (
              <li
                key={f}
                className={`flex items-start gap-2 text-sm ${i === 0 ? "font-semibold text-foreground" : "text-foreground-muted"}`}
              >
                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${i === 0 ? "text-primary" : "text-success"}`} />
                {f}
              </li>
            ))}
          </ul>
          <button className="btn-primary mt-6 w-full">
            <Sparkles className="h-4 w-4" />
            Start Premium
          </button>
        </Card>
      </div>

      <OrnateDivider className="my-10" />

      {/* Trust */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Shield, title: "Cancel Anytime", desc: "No contracts, no friction. Cancel in one click." },
          { icon: Shield, title: "The Cosmos Gave It. We Protect It.", desc: "Your birth data is encrypted, never sold, GDPR-compliant." },
          { icon: Shield, title: "Real Astronomy", desc: "Moshier ephemeris — the global standard for astrological calculation." },
        ].map((t) => (
          <div key={t.title} className="text-center">
            <t.icon className="mx-auto h-6 w-6 text-primary/60" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">{t.title}</h3>
            <p className="mt-1 text-xs text-foreground-muted">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <Eyebrow>Questions</Eyebrow>
        <div className="mt-4 space-y-4">
          {[
            { q: "Is the free tier really free?", a: "Yes — daily horoscopes, birth chart calculation, and personality profiles are free forever. No card required." },
            { q: "Can I cancel anytime?", a: "Absolutely. Cancel in one click from your account. No questions, no retention dark patterns." },
            { q: "Is my birth data safe?", a: "The cosmos gave it — we protect it. We encrypt your birth details, never sell them, never use them for advertising, and let you delete them anytime. GDPR-compliant by design." },
            { q: "What's Jehana?", a: "Jehana is your astrological guide — an AI trained on classical astrology texts who reads your chart and echoes it back. Not predictions. Reflections of who you already are." },
          ].map((faq) => (
            <Card key={faq.q} className="p-5">
              <h3 className="text-sm font-semibold text-foreground">{faq.q}</h3>
              <p className="mt-2 text-sm text-foreground-muted">{faq.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}