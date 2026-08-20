import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { Shield, Lock, Eye, Trash2, Download, Cookie } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "How Astrolo handles your personal data, birth data, and privacy. GDPR-compliant.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-8">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-foreground-muted">Last updated: August 2026</p>
      </div>

      <Card className="mb-6 p-6">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 shrink-0 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Your birth data is sacred</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Your birth date, time, and location are among the most personal data you can share.
              We treat them with the utmost care — encrypted, never sold, never used for advertising,
              and deletable by you at any time.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Section icon={Eye} title="What we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li>Email address (if you create an account)</li>
            <li>Birth date, time, and location (only if you enter them for chart calculation)</li>
            <li>Chat messages with the Jehana (only if you have an account)</li>
            <li>Anonymous usage statistics (only with your consent — see cookie banner)</li>
          </ul>
          <p className="mt-2">We do <strong>not</strong> collect: browsing history, device fingerprints, advertising identifiers, or any third-party tracking data.</p>
        </Section>

        <Section icon={Lock} title="How we store it">
          <ul className="list-disc pl-5 space-y-1">
            <li>Birth data is encrypted at rest in our database</li>
            <li>Passwords are hashed (we never see your password)</li>
            <li>All connections use HTTPS/TLS encryption</li>
            <li>Database access is restricted to authenticated server requests only</li>
          </ul>
        </Section>

        <Section icon={Trash2} title="Your right to delete">
          <p>You can delete your birth data or your entire account at any time from the Account page. Deletion is permanent and immediate — we do not keep backups of deleted data.</p>
          <p className="mt-2">This complies with GDPR Article 17 (Right to Erasure).</p>
        </Section>

        <Section icon={Download} title="Your right to export">
          <p>You can export all your data (birth chart, chat history, profile) as a JSON file from the Account page.</p>
          <p className="mt-2">This complies with GDPR Article 20 (Data Portability).</p>
        </Section>

        <Section icon={Cookie} title="Cookies and analytics">
          <p>We use <strong>privacy-first analytics</strong> (Plausible) that does not use cookies or track individuals. We do not use Google Analytics, Facebook Pixel, or any advertising tracker.</p>
          <p className="mt-2">If we ever add features that require cookies, you will see a consent banner (like the one you saw on first visit) and can decline.</p>
        </Section>

        <Section title="Legal basis (GDPR)">
          <p>Our legal basis for processing your data is:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Consent</strong> (Article 6(1)(a)) — for analytics and optional features</li>
            <li><strong>Contract</strong> (Article 6(1)(b)) — for account features and subscriptions</li>
          </ul>
          <p className="mt-2">Birth data may constitute special category data (Article 9) when combined with astrological interpretations. We process this only with your explicit consent.</p>
        </Section>

        <Section title="Data residency">
          <p>Our database is hosted in the EU (Supabase EU region). Our web hosting is on EU edge servers (Vercel). Our AI processing runs on EU-based infrastructure.</p>
        </Section>

        <Section title="Contact">
          <p>For privacy questions or data requests, contact us at <a href="mailto:privacy@astrolo.app" className="text-primary">privacy@astrolo.app</a>. We respond within 72 hours.</p>
          <p className="mt-2">You also have the right to lodge a complaint with your local data protection authority.</p>
        </Section>

        <Section title="Astrology disclaimer">
          <p className="text-xs text-foreground-subtle">
            Astrolo is for entertainment and self-reflection purposes only. Astrological readings are not a substitute for professional medical, legal, financial, or psychological advice. Always consult a qualified professional for important decisions.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon?: typeof Shield; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {title}
      </h2>
      <div className="mt-2 text-sm leading-relaxed text-foreground-muted">
        {children}
      </div>
    </div>
  );
}