"use client";

import { useEffect, useState } from "react";
import {
  fetchWeeklySummary,
  type DailySummary,
} from "../services/progress";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function getCurrentWeekStart() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  return addDays(today, -mondayOffset);
}

function fillWeek(startDate: Date, summaries: DailySummary[]) {
  const summariesByDate = new Map(
    summaries.map((summary) => [summary.date, summary]),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = formatLocalDate(addDays(startDate, index));
    return (
      summariesByDate.get(date) ?? {
        date,
        session_count: 0,
        total_work_time: 0,
      }
    );
  });
}

export function useWeeklySummary() {
  const [currentWeek, setCurrentWeek] = useState<DailySummary[] | null>(null);
  const [previousWeek, setPreviousWeek] = useState<DailySummary[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const currentWeekStart = getCurrentWeekStart();
    const previousWeekStart = addDays(currentWeekStart, -7);

    async function loadSummaries() {
      try {
        setHasError(false);
        const [currentData, previousData] = await Promise.all([
          fetchWeeklySummary(formatLocalDate(currentWeekStart), controller.signal),
          fetchWeeklySummary(formatLocalDate(previousWeekStart), controller.signal),
        ]);

        setCurrentWeek(fillWeek(currentWeekStart, currentData));
        setPreviousWeek(fillWeek(previousWeekStart, previousData));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHasError(true);
      }
    }

    loadSummaries();
    return () => controller.abort();
  }, []);

  const weeklyTotal = (currentWeek ?? []).reduce(
    (total, day) => total + day.total_work_time,
    0,
  );
  const previousWeekTotal = (previousWeek ?? []).reduce(
    (total, day) => total + day.total_work_time,
    0,
  );

  return {
    currentWeek,
    weeklyTotal,
    previousWeekTotal,
    hasError,
    isLoading: currentWeek === null && !hasError,
  };
}
