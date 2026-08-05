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
  const [month, setMonth] = useState(getCurrentMonth);
  const [summaries, setSummaries] = useState<DailySummary[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      try {
        setSummaries(null);
        setHasError(false);
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

  function changeMonth(offset: number) {
    setMonth((currentMonth) => {
      const [year, monthNumber] = currentMonth.split("-").map(Number);
      const target = new Date(year, monthNumber - 1 + offset, 1);
      const targetMonth = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
      return targetMonth > getCurrentMonth() ? currentMonth : targetMonth;
    });
  }

  return {
    month,
    summaries,
    hasError,
    isLoading: summaries === null && !hasError,
    isCurrentMonth: month === getCurrentMonth(),
    showPreviousMonth: () => changeMonth(-1),
    showNextMonth: () => changeMonth(1),
    showCurrentMonth: () => setMonth(getCurrentMonth()),
  };
}
