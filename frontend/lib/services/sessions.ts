import { MOCK_SESSION_HISTORY } from "../mocks/sessions";

export type StudySession = {
  id: number;
  work_time: number;
  rest_time: number;
  session_date: string;
};

// This function will call the future history endpoint when the API is available.
export function getSessionHistory(): StudySession[] {
  return MOCK_SESSION_HISTORY;
}
