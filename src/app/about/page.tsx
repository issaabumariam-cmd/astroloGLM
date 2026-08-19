import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";

export const metadata = {
  title: "About",
  description: "Astrolo — premium astrology PWA powered by real ephemeris calculation and AI.",
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
          Astrolo was born from a simple question: <em>what if astrology apps actually used real astronomy?</em>
        </p>
        <p>
          Most horoscope apps use generic sun-sign templates — the same reading for millions of people.
          Astrolo is different. We use the <strong>Moshier ephemeris</strong>, the same astronomical calculation
          engine that powers Astro.com, to compute real planetary positions. When we say &ldquo;Saturn is in
          your 10th house,&rdquo; we mean it astronomically — not as a vague approximation.
        </p>
        <p>
          Our AI advisor is trained on <strong>C.A.Q. Libra&apos;s &ldquo;Astrology: Its Technics and Ethics&rdquo;</strong>
          (1917), a classic text that bridges classical and modern astrology. Using RAG (Retrieval-Augmented
          Generation), the AI retrieves relevant passages from this book to ground its answers in real
          astrological tradition — not generic internet content.
        </p>
        <p>
          We believe astrology is a tool for <strong>self-knowledge, not fortune-telling</strong>. Every reading
          frames cosmic patterns as invitations for reflection, not predictions of fixed outcomes. Free will
          and personal responsibility are always paramount.
        </p>
        <p>
          We also believe your <strong>birth data is sacred</strong>. We encrypt it, never sell it, never use
          it for advertising, and let you delete it with one click. GDPR-compliant by design.
        </p>
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-sm font-semibold text-foreground">Technology</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-foreground-muted">Ephemeris</dt><dd className="font-medium text-foreground">Moshier (pure JS, ~0.1 arcsec accuracy)</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">AI Model</dt><dd className="font-medium text-foreground">Gemma 4 31B (via Ollama)</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Embeddings</dt><dd className="font-medium text-foreground">nomic-embed-text (768-dim)</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Knowledge base</dt><dd className="font-medium text-foreground">C.A.Q. Libra (1917), 1,446 chunks</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Framework</dt><dd className="font-medium text-foreground">Next.js 16 + TypeScript</dd></div>
          <div className="flex justify-between"><dt className="text-foreground-muted">Privacy</dt><dd className="font-medium text-foreground">GDPR-compliant, no tracking cookies</dd></div>
        </dl>
      </Card>
    </div>
  );
}