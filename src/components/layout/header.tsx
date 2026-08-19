"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/echo", label: "Echo", highlight: true },
  { href: "/horoscope", label: "Horoscope" },
  { href: "/personal", label: "AI Horoscope" },
  { href: "/signs", label: "Signs" },
  { href: "/compatibility", label: "Compatibility" },
  { href: "/birth-chart", label: "Birth Chart" },
  { href: "/advisor", label: "AI Advisor" },
  { href: "/book", label: "Library" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <ZodiacWheel size={32} className="text-primary" />
          <span className="heading-serif text-2xl font-semibold text-foreground">
            Astrolo
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/advisor" className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-primary-hover sm:inline-flex">
            <Sparkles className="h-4 w-4" />
            Ask the Stars
          </Link>
          <Link href="/pricing" className="hidden text-sm font-medium text-foreground-muted transition-colors hover:text-foreground md:block">
            Premium
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-foreground-muted hover:bg-surface-muted md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border bg-surface md:hidden",
          mobileOpen ? "max-h-96" : "max-h-0"
        )}
        style={{ transition: "max-height 0.2s ease" }}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/pricing"
            onClick={() => setMobileOpen(false)}
            className="mt-2 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-surface"
          >
            Get Premium
          </Link>
        </nav>
      </div>
    </header>
  );
}