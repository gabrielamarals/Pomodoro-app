"use client";

import { useEffect, useState } from "react";
import {
  fetchSessionsByDate,
  type StudySession,
} from "../services/sessions";

export function useSessionsByDate(date: string | null) {
  const [sessions, setSessions] = useState<StudySession[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!date) {
      setSessions(null);
      setHasError(false);
      return;
    }

    const controller = new AbortController();
    setSessions(null);
    setHasError(false);

    async function loadSessions() {
      try {
        const data = await fetchSessionsByDate(date, controller.signal);
        setSessions(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHasError(true);
      }
    }

    loadSessions();
    return () => controller.abort();
  }, [date]);

  return {
    sessions,
    hasError,
    isLoading: date !== null && sessions === null && !hasError,
  };
}
