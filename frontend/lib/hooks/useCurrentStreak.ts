"use client";

import { useEffect, useState } from "react";
import { fetchCurrentStreak } from "../services/progress";

export function useCurrentStreak() {
  const [streak, setStreak] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentStreak(controller.signal)
      .then(setStreak)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHasError(true);
      });
    return () => controller.abort();
  }, []);

  return { streak, hasError, isLoading: streak === null && !hasError };
}
