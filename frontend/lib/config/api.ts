const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || "/api").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
  });
}
