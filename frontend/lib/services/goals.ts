const API_BASE_URL = "http://localhost:8000";

export type StudyGoal = {
  id: number;
  daily_goal_minutes: number;
  created_at: string;
};

export async function fetchCurrentGoal(signal?: AbortSignal): Promise<StudyGoal | null> {
  const response = await fetch(`${API_BASE_URL}/goals/current`, { signal });
  if (!response.ok) throw new Error(`Current goal request failed with status ${response.status}`);
  return response.json() as Promise<StudyGoal | null>;
}

export async function createStudyGoal(dailyGoalMinutes: number): Promise<StudyGoal> {
  const response = await fetch(`${API_BASE_URL}/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ daily_goal_minutes: dailyGoalMinutes }),
  });
  if (!response.ok) throw new Error(`Goal request failed with status ${response.status}`);
  return response.json() as Promise<StudyGoal>;
}
