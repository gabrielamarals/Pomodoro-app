import { apiFetch } from "../config/api";

export type StudySession = {
  id: number;
  work_time: number;
  rest_time: number;
  session_date: string;
  goal: string | null;
  category_id: number | null;
  category_name: string | null;
  focus_quality: number | null;
  distraction: string | null;
  distraction_note: string | null;
  client_session_id: string | null;
};

export type SessionCreate = {
  work_time: number;
  rest_time: number;
  session_date: string;
  goal: string | null;
  category_id: number | null;
  client_session_id: string;
};

export type SessionReflectionUpdate = {
  focus_quality: number;
  distraction: string | null;
  distraction_note: string | null;
};

export class SessionRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(detail);
    this.name = "SessionRequestError";
  }
}

export async function createSession(
  session: SessionCreate,
): Promise<StudySession> {
  const response = await apiFetch("/sessions", {
    method: "POST",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new SessionRequestError(
      response.status,
      body?.detail ?? `Create session request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<StudySession>;
}

export async function fetchSessionByClientId(
  clientSessionId: string,
): Promise<StudySession | null> {
  const response = await apiFetch(
    `/sessions/by-client-id/${encodeURIComponent(clientSessionId)}`,
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new SessionRequestError(
      response.status,
      `Session confirmation failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<StudySession>;
}

export async function updateSessionReflection(
  sessionId: number,
  reflection: SessionReflectionUpdate,
): Promise<StudySession> {
  const response = await apiFetch(
    `/sessions/${sessionId}/reflection`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reflection),
    },
  );

  if (!response.ok) {
    throw new Error(`Session reflection request failed with status ${response.status}`);
  }

  return response.json() as Promise<StudySession>;
}

export async function fetchRecentSessions(
  limit = 20,
  signal?: AbortSignal,
): Promise<StudySession[]> {
  const response = await apiFetch(
    `/sessions/recent?limit=${encodeURIComponent(limit)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Recent sessions request failed with status ${response.status}`);
  }

  return response.json() as Promise<StudySession[]>;
}

export async function fetchSessionsByDate(
  date: string,
  signal?: AbortSignal,
): Promise<StudySession[]> {
  const response = await apiFetch(
    `/sessions/by-date?date=${encodeURIComponent(date)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Sessions-by-date request failed with status ${response.status}`);
  }

  return response.json() as Promise<StudySession[]>;
}
