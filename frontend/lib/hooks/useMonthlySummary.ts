"use client";

import { useEffect, useState } from "react";
import {
  fetchMonthlySummary,
  type DailySummary,
} from "../services/progress";

function getCurrentMonth() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 7);
}

export function useMonthlySummary() {
  const [month] = useState(getCurrentMonth);
  const [summaries, setSummaries] = useState<DailySummary[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      try {
        const data = await fetchMonthlySummary(month, controller.signal);
        setSummaries(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHasError(true);
      }
    }

    loadSummary();
    return () => controller.abort();
  }, [month]);

  return {
    month,
    summaries,
    hasError,
    isLoading: summaries === null && !hasError,
  };
}
