import Link from "next/link";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <ZodiacWheel size={80} className="text-primary/40 mb-6" />
      <h1 className="heading-serif text-4xl font-semibold text-foreground">Lost in the cosmos</h1>
      <p className="mt-3 text-sm text-foreground-muted">
        The stars couldn&apos;t find what you&apos;re looking for. Let&apos;s get you back on track.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Return Home
      </Link>
    </div>
  );
}