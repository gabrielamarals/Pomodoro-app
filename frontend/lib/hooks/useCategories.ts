"use client";

import { useEffect, useState } from "react";
import {
  createCategory,
  fetchCategories,
  type Category,
} from "../services/categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const data = await fetchCategories(controller.signal);
        setCategories(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHasError(true);
      }
    }

    void loadCategories();
    return () => controller.abort();
  }, []);

  async function addCategory(name: string) {
    setIsCreating(true);

    try {
      const createdCategory = await createCategory(name);
      setCategories((current) =>
        [...(current ?? []), createdCategory].sort((first, second) =>
          first.name.localeCompare(second.name, "pt-BR"),
        ),
      );
      return createdCategory;
    } finally {
      setIsCreating(false);
    }
  }

  return {
    categories,
    hasError,
    isLoading: !categories && !hasError,
    isCreating,
    addCategory,
  };
}
