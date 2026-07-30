"use client";

import { useEffect, useState } from "react";
import {
  fetchRecentSessions,
  type StudySession,
} from "../services/sessions";

export function useRecentSessions(limit = 20) {
  const [sessions, setSessions] = useState<StudySession[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSessions() {
      try {
        const data = await fetchRecentSessions(limit, controller.signal);
        setSessions(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHasError(true);
      }
    }

    loadSessions();
    return () => controller.abort();
  }, [limit]);

  return {
    sessions,
    hasError,
    isLoading: sessions === null && !hasError,
  };
}
