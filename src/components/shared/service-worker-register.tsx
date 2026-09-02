"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let refreshing = false;

    // The moment the NEW service worker takes control of this page,
    // reload once — guarantees users land on the fresh version in the
    // same visit instead of waiting for the next navigation.
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // updateViaCache:'none' — never let the HTTP cache serve a stale
    // sw.js for update checks (some Android WebViews cache it hard).
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch(() => {});

    // Check for SW updates when the app becomes visible again
    // (covers: PWA left open in background for days).
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // And a slow periodic check (every hour) for long-lived sessions.
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
    }, 60 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, []);
  return null;
}