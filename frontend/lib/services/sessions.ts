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
};

export type SessionCreate = {
  work_time: number;
  rest_time: number;
  session_date: string;
  goal: string | null;
  category_id: number | null;
};

export type SessionReflectionUpdate = {
  focus_quality: number;
  distraction: string | null;
  distraction_note: string | null;
};

export async function createSession(
  session: SessionCreate,
): Promise<StudySession> {
  const response = await apiFetch("/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    throw new Error(`Create session request failed with status ${response.status}`);
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
