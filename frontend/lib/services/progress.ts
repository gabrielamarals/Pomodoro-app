import {
  MOCK_DAILY_SUMMARY,
  MOCK_MONTHLY_SUMMARY,
  MOCK_PROGRESS_OVERVIEW,
  MOCK_WEEKLY_SUMMARY,
} from "../mocks/progress";

export type DailySummary = {
  date: string;
  session_count: number;
  total_work_time: number;
};

export type ProgressOverview = {
  current_streak: number;
  weekly_total: number;
  monthly_total: number;
  previous_week_total: number;
};

// This service is the only layer that will change when the API is available.
// Components should not import mock files directly.
export function getDailySummary(): DailySummary {
  return MOCK_DAILY_SUMMARY;
}

export function getWeeklySummary(): DailySummary[] {
  return MOCK_WEEKLY_SUMMARY;
}

export function getMonthlySummary(): DailySummary[] {
  return MOCK_MONTHLY_SUMMARY;
}

export function getProgressOverview(): ProgressOverview {
  return MOCK_PROGRESS_OVERVIEW;
}
