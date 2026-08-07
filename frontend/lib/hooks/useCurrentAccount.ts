"use client";

import { useEffect, useState } from "react";
import { getCurrentAccount, type Account } from "../services/auth";

export function useCurrentAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getCurrentAccount(controller.signal)
      .then(setAccount)
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setAccount(null);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [refreshKey]);

  return { account, isLoading, refresh: () => setRefreshKey((value) => value + 1) };
}
