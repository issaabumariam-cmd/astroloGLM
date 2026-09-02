"use client";

import { useEffect, useState } from "react";
import { WifiOff, CloudOff, X } from "lucide-react";

/**
 * Network health banner.
 * Detects total connectivity loss (offline) AND the sneakier case:
 * the page loaded from the service-worker cache but the API/backend is
 * unreachable (e.g. ISP filtering *.vercel.app, captive portal, DNS
 * hijack). In that state the app is serving a cached shell — chat,
 * search, and everything server-side will fail with misleading errors.
 */

type NetworkState = "ok" | "offline" | "blocked";

export function NetworkBanner() {
  const [state, setState] = useState<NetworkState>("ok");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;

    const probe = async () => {
      let next: NetworkState = "ok";
      if (!navigator.onLine) {
        next = "offline";
      } else {
        try {
          // Our own tiny endpoint — same-origin, no-cache, fast.
          // A fetch that fails while navigator.onLine is true means
          // something between the user and the server is filtering.
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 8000);
          const res = await fetch("/api/health?probe=" + Date.now(), {
            cache: "no-store",
            signal: ctrl.signal,
          });
          clearTimeout(t);
          next = res.ok ? "ok" : "blocked";
        } catch {
          next = "blocked";
        }
      }
      if (alive) setState(next);
    };

    probe();
    const interval = setInterval(probe, 30_000);
    const onOnline = () => probe();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOnline);
    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
    };
  }, []);

  if (state === "ok" || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] flex items-start gap-3 border-b border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-soft"
    >
      {state === "offline" ? (
        <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div>
        {state === "offline" ? (
          <>
            <p className="font-medium">You're offline</p>
            <p className="mt-0.5 text-amber-800">
              You can browse previously visited pages. Reconnect to chat with Jehana or generate new readings.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">Your network is blocking Astrolo</p>
            <p className="mt-0.5 text-amber-800">
              The page loaded from cache, but our server can't be reached — chat, search, and new readings won't work right now.
              Try a different network (e.g. mobile data) or a VPN.
            </p>
          </>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="ml-auto mt-0.5 shrink-0 rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}