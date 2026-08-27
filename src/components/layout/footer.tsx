import Link from "next/link";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";

const footerLinks = {
  Explore: [
    { href: "/horoscope", label: "Daily Horoscope" },
    { href: "/signs", label: "Zodiac Signs" },
    { href: "/compatibility", label: "Compatibility" },
    { href: "/birth-chart", label: "Birth Chart" },
  ],
  Features: [
    { href: "/jehana", label: "Jehana" },
    { href: "/book", label: "Library" },
    { href: "/transits", label: "Current Transits" },
    { href: "/pricing", label: "Premium" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
};

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <ZodiacWheel size={32} className="text-primary" />
              <span className="heading-serif text-2xl font-semibold text-foreground">
                Astrolo
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground-muted">
              The universe wrote your story. Jehana reads it back to you.
              Real astronomy, classical wisdom, cosmic self-knowledge.
            </p>
            <p className="mt-4 text-xs text-foreground-subtle">
              Powered by the Moshier ephemeris — the global standard for
              astronomical calculation.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="section-header mb-3">{section}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-muted transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-foreground-subtle">
            © {new Date().getFullYear()} Astrolo. The cosmos, echoed back.
          </p>
          <p className="text-xs text-foreground-subtle">
            The cosmos gave it — we protect it.
          </p>
        </div>
      </div>
    </footer>
  );
}