"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, type AuthUser } from "../services/auth";

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then(setUser)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setUser(null);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  return { user, isLoading };
}
