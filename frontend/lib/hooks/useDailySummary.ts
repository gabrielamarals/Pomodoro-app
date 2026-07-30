"use client";

import { useEffect, useState } from "react";
import {
  fetchDailySummary,
  type DailySummary,
} from "../services/progress";

function getLocalDate() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 10);
}

export function useDailySummary() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      try {
        setHasError(false);
        const data = await fetchDailySummary(getLocalDate(), controller.signal);
        setSummary(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHasError(true);
      }
    }

    loadSummary();
    return () => controller.abort();
  }, [reloadKey]);

  return {
    summary,
    hasError,
    isLoading: !summary && !hasError,
    refresh: () => setReloadKey((current) => current + 1),
  };
}
