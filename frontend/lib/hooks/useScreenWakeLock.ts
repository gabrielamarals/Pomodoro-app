"use client";

import { useEffect, useRef } from "react";

export function useScreenWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function requestWakeLock() {
      if (
        !enabled ||
        cancelled ||
        document.visibilityState !== "visible" ||
        wakeLockRef.current ||
        !("wakeLock" in navigator)
      ) {
        return;
      }

      try {
        const wakeLock = await navigator.wakeLock.request("screen");

        if (cancelled) {
          await wakeLock.release();
          return;
        }

        wakeLockRef.current = wakeLock;
        wakeLock.addEventListener(
          "release",
          () => {
            if (wakeLockRef.current === wakeLock) {
              wakeLockRef.current = null;
            }
          },
          { once: true },
        );
      } catch {
        // The timer must keep working if the browser or operating system
        // refuses the optional wake lock (for example, in battery saver mode).
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      }
    }

    void requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      const wakeLock = wakeLockRef.current;
      wakeLockRef.current = null;
      if (wakeLock && !wakeLock.released) {
        void wakeLock.release().catch(() => undefined);
      }
    };
  }, [enabled]);
}
