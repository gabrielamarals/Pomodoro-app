"use client";

import { useEffect, useMemo, useState } from "react";
import { createStudyGoal, fetchCurrentGoal } from "../services/goals";

const DAILY_GOAL_STORAGE_KEY = "pomodoro.daily-goal.v1";
const DEFAULT_DAILY_GOAL = 75;

export function useDailyGoal() {
  const [dailyGoal, setDailyGoalState] = useState(DEFAULT_DAILY_GOAL);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const savedGoal = Number(window.localStorage.getItem(DAILY_GOAL_STORAGE_KEY));
    if (Number.isFinite(savedGoal) && savedGoal >= 1 && savedGoal <= 720) {
      setDailyGoalState(Math.round(savedGoal));
    }
    fetchCurrentGoal(controller.signal)
      .then((goal) => {
        if (goal) {
          setDailyGoalState(goal.daily_goal_minutes);
          window.localStorage.setItem(DAILY_GOAL_STORAGE_KEY, String(goal.daily_goal_minutes));
        }
      })
      .catch(() => {
        // The local preference remains available when the API is offline.
      })
      .finally(() => setIsHydrated(true));
    return () => controller.abort();
  }, []);

  function setDailyGoal(goal: number) {
    const nextGoal = Math.min(720, Math.max(1, Math.round(goal)));
    setDailyGoalState(nextGoal);
    window.localStorage.setItem(DAILY_GOAL_STORAGE_KEY, String(nextGoal));
    void createStudyGoal(nextGoal).catch(() => {
      // Local storage is the fallback until the API is available.
    });
  }

  const weeklyGoal = useMemo(() => dailyGoal * 7, [dailyGoal]);

  return { dailyGoal, setDailyGoal, weeklyGoal, isHydrated };
}
