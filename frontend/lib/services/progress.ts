const API_BASE_URL = "http://localhost:8000";

export type DailySummary = {
  date: string;
  session_count: number;
  total_work_time: number;
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

export async function fetchCurrentStreak(signal?: AbortSignal): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/sessions/streak`, { signal });
  if (!response.ok) throw new Error(`Streak request failed with status ${response.status}`);
  const data = (await response.json()) as { current_streak: number };
  return data.current_streak;
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

export async function fetchWeeklySummary(
  startDate: string,
  signal?: AbortSignal,
): Promise<DailySummary[]> {
  const response = await fetch(
    `${API_BASE_URL}/sessions/weekly?start_date=${encodeURIComponent(startDate)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Weekly summary request failed with status ${response.status}`);
  }

  return response.json() as Promise<DailySummary[]>;
}
