"use client";

import { useEffect } from "react";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <ZodiacWheel size={80} className="text-primary/40 mb-6" />
      <h1 className="heading-serif text-3xl font-semibold text-foreground">
        The stars misaligned
      </h1>
      <p className="mt-3 text-sm text-foreground-muted">
        Something went wrong on our end. Try again, or return home.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-foreground-subtle">Error ID: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
        <Link href="/" className="btn-secondary">
          Return Home
        </Link>
      </div>
    </div>
  );
}