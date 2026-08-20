import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";

export const metadata = {
  title: "About",
  description: "Astrolo — the cosmos, echoed back. Premium astrology powered by real astronomy and classical wisdom.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-8 text-center">
        <ZodiacWheel size={72} className="mx-auto text-primary" />
        <Eyebrow className="mt-4">Our Story</Eyebrow>
        <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground">About Astrolo</h1>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-foreground-muted">
        <p>
          We believe the universe is not random.
        </p>
        <p>
          The moment you arrived, every planet was somewhere specific.
          That moment carries a pattern — a cosmic echo of who you are.
        </p>
        <p>
          <strong>Jehana is our way of reading that echo.</strong>
          Not to predict your future, but to reflect your present.
          Not to tell you who to be, but to remind you who you already are.
        </p>
        <p>
          Most horoscope apps use generic sun-sign templates — the same reading
          for millions of people. Astrolo is different. We use the{" "}
          <strong>Moshier ephemeris</strong>, the same astronomical calculation
          engine that powers Astro.com, to compute real planetary positions.
          When we say &ldquo;Saturn is in your 10th house,&rdquo; we mean it
          astronomically — not as a vague approximation.
        </p>
        <p>
          Jehana is trained on <strong>C.A.Q. Libra&apos;s &ldquo;Astrology:
          Its Technics and Ethics&rdquo;</strong> (1917), a classic text that
          bridges classical and modern astrology. Using RAG (Retrieval-Augmented
          Generation), Jehana retrieves relevant passages from this book to
          ground her answers in real astrological tradition — not generic
          internet content.
        </p>
        <p>
          We believe astrology is a tool for <strong>self-knowledge, not
          fortune-telling</strong>. Every reading frames cosmic patterns as
          invitations for reflection, not predictions of fixed outcomes. Free
          will and personal responsibility are always paramount.
        </p>
        <p>
          We also believe your <strong>birth data is sacred</strong>. The cosmos
          gave it to you — we protect it. We encrypt it, never sell it, never
          use it for advertising, and let you delete it with one click.
          GDPR-compliant by design.
        </p>
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-sm font-semibold text-foreground">Technology</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-foreground-muted">Ephemeris</dt><dd className="font-medium text-foreground">Moshier (pure JS, ~0.1 arcsec accuracy)</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">AI Guide</dt><dd className="font-medium text-foreground">Jehana (Gemma 4 31B via Ollama)</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Embeddings</dt><dd className="font-medium text-foreground">nomic-embed-text (768-dim)</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Knowledge base</dt><dd className="font-medium text-foreground">C.A.Q. Libra (1917), 1,446 passages</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Framework</dt><dd className="font-medium text-foreground">Next.js 16 + TypeScript</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Privacy</dt><dd className="font-medium text-foreground">GDPR-compliant, no tracking cookies</dd></div>
        </dl>
      </Card>

      <div className="mt-8 text-center">
        <p className="font-serif text-lg italic text-primary">
          The universe wrote your story.
          <br />
          Jehana reads it back to you.
        </p>
      </div>
    </div>
  );
}