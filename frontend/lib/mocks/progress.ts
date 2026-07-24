// Temporary data used while the back-end API is not available.
// Field names intentionally match the future JSON contract.
export const MOCK_DAILY_SUMMARY = {
  date: "2026-07-24",
  session_count: 2,
  total_work_time: 50,
};

export const MOCK_WEEKLY_SUMMARY = [
  { date: "2026-07-20", session_count: 1, total_work_time: 25 },
  { date: "2026-07-21", session_count: 2, total_work_time: 50 },
  { date: "2026-07-22", session_count: 1, total_work_time: 35 },
  { date: "2026-07-23", session_count: 1, total_work_time: 40 },
  { date: "2026-07-24", session_count: 2, total_work_time: 50 },
  { date: "2026-07-25", session_count: 0, total_work_time: 0 },
  { date: "2026-07-26", session_count: 0, total_work_time: 0 },
];

export const MOCK_MONTHLY_SUMMARY = [
  { date: "2026-07-02", session_count: 1, total_work_time: 25 },
  { date: "2026-07-04", session_count: 2, total_work_time: 50 },
  { date: "2026-07-07", session_count: 1, total_work_time: 40 },
  { date: "2026-07-08", session_count: 3, total_work_time: 75 },
  { date: "2026-07-11", session_count: 2, total_work_time: 50 },
  { date: "2026-07-13", session_count: 1, total_work_time: 25 },
  { date: "2026-07-14", session_count: 4, total_work_time: 100 },
  { date: "2026-07-16", session_count: 2, total_work_time: 50 },
  { date: "2026-07-17", session_count: 1, total_work_time: 35 },
  { date: "2026-07-20", session_count: 1, total_work_time: 25 },
  { date: "2026-07-21", session_count: 2, total_work_time: 50 },
  { date: "2026-07-22", session_count: 1, total_work_time: 35 },
  { date: "2026-07-23", session_count: 1, total_work_time: 40 },
  { date: "2026-07-24", session_count: 2, total_work_time: 50 },
];

export const MOCK_PROGRESS_OVERVIEW = {
  current_streak: 4,
  weekly_total: 200,
  monthly_total: 540,
  previous_week_total: 170,
};
