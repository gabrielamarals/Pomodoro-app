"use client";

import { useEffect, useState } from "react";
import {
  fetchSessionsByCategory,
} from "../services/categories";
import type { StudySession } from "../services/sessions";

export function useSessionsByCategory(categoryId: number | null) {
  const [sessions, setSessions] = useState<StudySession[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (categoryId === null) {
      setSessions(null);
      setHasError(false);
      return;
    }

    const controller = new AbortController();

    async function loadSessions() {
      try {
        setSessions(null);
        setHasError(false);
        const data = await fetchSessionsByCategory(categoryId, controller.signal);
        setSessions(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHasError(true);
      }
    }

    void loadSessions();
    return () => controller.abort();
  }, [categoryId]);

  return {
    sessions,
    hasError,
    isLoading: categoryId !== null && sessions === null && !hasError,
  };
}
