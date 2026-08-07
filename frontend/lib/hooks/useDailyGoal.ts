"use client";

import { useEffect, useMemo, useState } from "react";
import { createStudyGoal, fetchCurrentGoal } from "../services/goals";

const DEFAULT_DAILY_GOAL = 75;

export function useDailyGoal() {
  const [dailyGoal, setDailyGoalState] = useState(DEFAULT_DAILY_GOAL);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentGoal(controller.signal)
      .then((goal) => {
        if (goal) {
          setDailyGoalState(goal.daily_goal_minutes);
        }
      })
      .catch(() => {
        // Keep the neutral default when account data is unavailable.
      })
      .finally(() => setIsHydrated(true));
    return () => controller.abort();
  }, []);

  function setDailyGoal(goal: number) {
    const nextGoal = Math.min(720, Math.max(1, Math.round(goal)));
    setDailyGoalState(nextGoal);
    void createStudyGoal(nextGoal).catch(() => {
      // The optimistic value lasts only for this page view when saving fails.
    });
  }

  const weeklyGoal = useMemo(() => dailyGoal * 7, [dailyGoal]);

  return { dailyGoal, setDailyGoal, weeklyGoal, isHydrated };
}
