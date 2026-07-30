import {
  MOCK_PROGRESS_OVERVIEW,
  MOCK_WEEKLY_SUMMARY,
} from "../mocks/progress";

const API_BASE_URL = "http://127.0.0.1:8000";

export type DailySummary = {
  date: string;
  session_count: number;
  total_work_time: number;
};

export type ProgressOverview = {
  current_streak: number;
  weekly_total: number;
  previous_week_total: number;
};

export async function fetchDailySummary(
  date: string,
  signal?: AbortSignal,
): Promise<DailySummary> {
  const response = await fetch(
    `${API_BASE_URL}/sessions/daily?date=${encodeURIComponent(date)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Daily summary request failed with status ${response.status}`);
  }

  return response.json() as Promise<DailySummary>;
}

export async function fetchMonthlySummary(
  month: string,
  signal?: AbortSignal,
): Promise<DailySummary[]> {
  const response = await fetch(
    `${API_BASE_URL}/sessions/monthly?month=${encodeURIComponent(month)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Monthly summary request failed with status ${response.status}`);
  }

  return response.json() as Promise<DailySummary[]>;
}

// The remaining functions still use mocks until their API routes are available.
export function getWeeklySummary(): DailySummary[] {
  return MOCK_WEEKLY_SUMMARY;
}

export function getProgressOverview(): ProgressOverview {
  return MOCK_PROGRESS_OVERVIEW;
}
