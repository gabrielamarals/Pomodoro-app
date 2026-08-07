import type { StudySession } from "./sessions";

const API_BASE_URL = "http://localhost:8000";

export type Category = {
  id: number;
  name: string;
};

export class CategoryRequestError extends Error {
  status: number;

  constructor(status: number) {
    super(`Category request failed with status ${status}`);
    this.status = status;
  }
}

export async function fetchCategories(
  signal?: AbortSignal,
): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`, { signal });

  if (!response.ok) {
    throw new CategoryRequestError(response.status);
  }

  return response.json() as Promise<Category[]>;
}

export async function createCategory(name: string): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new CategoryRequestError(response.status);
  }

  return response.json() as Promise<Category>;
}

export async function fetchSessionsByCategory(
  categoryId: number,
  signal?: AbortSignal,
): Promise<StudySession[]> {
  const response = await fetch(
    `${API_BASE_URL}/categories/${categoryId}/sessions`,
    { signal },
  );

  if (!response.ok) {
    throw new CategoryRequestError(response.status);
  }

  return response.json() as Promise<StudySession[]>;
}
