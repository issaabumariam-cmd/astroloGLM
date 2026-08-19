"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton({
  title,
  text,
  url,
  className = "",
}: {
  title: string;
  text: string;
  url?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard failed
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`btn-ghost text-xs ${className}`}
      aria-label="Share"
    >
      {copied ? (
        <><Check className="h-3.5 w-3.5" /> Copied!</>
      ) : (
        <><Share2 className="h-3.5 w-3.5" /> Share</>
      )}
    </button>
  );
}