"use client";

import { useState, useEffect } from "react";
import { Shield, X } from "lucide-react";

const CONSENT_KEY = "astrolo-consent";
const CONSENT_VERSION = "1";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored || JSON.parse(stored).version !== CONSENT_VERSION) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, status: "accepted", date: new Date().toISOString() }));
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, status: "declined", date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-3xl m-4 rounded-xl border border-border bg-surface p-5 shadow-lifted">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Your privacy, your choice</h3>
            <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
              We use privacy-first analytics (no cookies, no tracking, no advertising).
              Your birth data is encrypted and never sold. We need your consent to
              collect anonymous usage statistics that help us improve.{" "}
              <a href="/privacy" className="text-primary underline">Read our privacy policy</a>
            </p>
            <div className="mt-3 flex gap-2">
              <button onClick={accept} className="btn-primary text-xs py-1.5 px-3">
                Accept
              </button>
              <button onClick={decline} className="btn-secondary text-xs py-1.5 px-3">
                Decline
              </button>
              <button onClick={() => setVisible(false)} className="btn-ghost text-xs py-1.5 px-2 ml-auto" aria-label="Close">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}