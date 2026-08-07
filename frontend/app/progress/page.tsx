"use client";

import { AppNavigation } from "../components/AppNavigation";
import { useI18n } from "../../lib/i18n/I18nProvider";
import { useEffect, useState } from "react";
import { StudyActivityMap } from "../components/StudyActivityMap";
import { TodaySummaryCard } from "../components/TodaySummaryCard";
import { WeeklyGoalCard } from "../components/WeeklyGoalCard";
import { formatMinutes } from "../../lib/formatters/time";
import { useDailyGoal } from "../../lib/hooks/useDailyGoal";
import { useCurrentStreak } from "../../lib/hooks/useCurrentStreak";
import { useMonthlySummary } from "../../lib/hooks/useMonthlySummary";
import { useWeeklySummary } from "../../lib/hooks/useWeeklySummary";

export default function ProgressPage() {
  const { locale, t } = useI18n();
  const dayLabels = locale === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const {
    currentWeek,
    weeklyTotal,
    hasError: weeklySummaryError,
    isLoading: weeklySummaryLoading,
  } = useWeeklySummary();
  const { dailyGoal, setDailyGoal, isHydrated } = useDailyGoal();
  const { streak, hasError: streakError, isLoading: streakLoading } = useCurrentStreak();
  const [draftGoal, setDraftGoal] = useState(dailyGoal);
  const [goalSaved, setGoalSaved] = useState(false);
  useEffect(() => {
    if (isHydrated) setDraftGoal(dailyGoal);
  }, [dailyGoal, isHydrated]);
  const week = currentWeek ?? [];
  const {
    month,
    summaries: monthlySummaries,
    hasError: monthlySummaryError,
    isLoading: monthlySummaryLoading,
    isCurrentMonth,
    showPreviousMonth,
    showNextMonth,
    changeYear,
    showCurrentMonth,
  } = useMonthlySummary();
  const monthlyTotal = (monthlySummaries ?? []).reduce(
    (total, day) => total + day.total_work_time,
    0,
  );

  return (
    <main className="app-shell">
      <AppNavigation activePage="progress" />
      <section className="workspace progress-workspace">
        <header className="topbar progress-topbar">
          <div>
            <p className="eyebrow">{t("progressEyebrow")}</p>
            <h1>{t("progressTitle")}</h1>
          </div>
          <span className="demo-badge">{t("yourProgress")}</span>
        </header>

        <section className="stats-grid" aria-label={t("progressSummaryAria")}>
          <TodaySummaryCard />
          <article className="stat-card">
            <span>{t("thisWeek")}</span>
            <strong>{weeklySummaryLoading ? "—" : formatMinutes(weeklyTotal)}</strong>
            <small>{weeklySummaryError ? t("noWeekSessions") : `${dailyGoal} ${t("minuteShort")} · ${t("dailyGoal")}`}</small>
          </article>
          <article className="stat-card">
            <span>{t("displayedMonth")}</span>
            <strong>{monthlySummaryLoading ? "—" : formatMinutes(monthlyTotal)}</strong>
            <small>{monthlySummaryError ? t("noMonthSessions") : t("studiedTime")}</small>
          </article>
          <article className="stat-card">
            <span>{t("currentStreak")}</span>
            <strong>{streakLoading ? "—" : streakError ? "!" : streak}</strong>
            <small>{streakError ? t("startStreak") : streak === 1 ? t("studiedDay") : t("consecutiveDays")}</small>
          </article>
        </section>

        <section className="goals-layout progress-goals-layout" aria-label={t("goalsSummaryAria")}>
          <div className="goal-editor-card">
            <p className="eyebrow">{t("dailyGoal")}</p>
            <h2>{t("dailyGoalQuestion")}</h2>
            <p className="goal-editor-copy">{t("dailyGoalHelp")}</p>
            <label className="goal-input-label" htmlFor="daily-goal">{t("minutesPerDay")}</label>
            <div className="goal-input-row">
              <input
                id="daily-goal"
                type="number"
                min={1}
                max={720}
                step={5}
                value={draftGoal}
                onChange={(event) => setDraftGoal(Math.min(720, Math.max(1, Number(event.target.value) || 1)))}
              />
              <span>{t("minutes")}</span>
            </div>
            <p className="goal-weekly-preview">{t("weeklyGoal")}: <strong>{draftGoal * 7} {t("minutes")}</strong>.</p>
            <button
              className="primary-action goal-save-button"
              type="button"
              onClick={() => {
                setDailyGoal(draftGoal);
                setGoalSaved(true);
                window.setTimeout(() => setGoalSaved(false), 2200);
              }}
            >
              {t("saveGoal")}
            </button>
            {goalSaved && <small className="goal-saved-feedback" role="status">{t("goalSavedLocal")}</small>}
          </div>
          <WeeklyGoalCard dailyGoal={dailyGoal} hasError={weeklySummaryError} isLoading={weeklySummaryLoading} week={week} />
        </section>

        <div className="progress-grid">
          <section className="chart-card" aria-labelledby="weekly-chart-title">
            <div className="progress-card-heading">
              <div>
                <p className="eyebrow">{t("currentWeek")}</p>
                <h2 id="weekly-chart-title">{t("weeklyRhythm")}</h2>
              </div>
              <strong>{weeklySummaryLoading ? "—" : formatMinutes(weeklyTotal)}</strong>
            </div>
            <div className="weekly-chart">
              {week.map((day) => {
                const date = new Date(`${day.date}T12:00:00`);
                const height = day.total_work_time === 0
                  ? 0
                  : Math.min(100, Math.max(1, (day.total_work_time / dailyGoal) * 100));
                return (
                  <div className="chart-column" key={day.date}>
                    <span className="chart-value">{day.total_work_time || "—"}</span>
                    <div className="chart-track"><span style={{ height: `${height}%` }} /></div>
                    <small>{dayLabels[date.getDay()]}</small>
                  </div>
                );
              })}
              {weeklySummaryError && <p className="weekly-chart-message">{t("noWeeklyData")}</p>}
              {weeklySummaryLoading && <p className="weekly-chart-message">{t("loadingWeekly")}</p>}
            </div>
          </section>
          <aside className="progress-context-card">
            <p className="eyebrow">{t("panelGuide")}</p>
            <h2>{t("panelGuideTitle")}</h2>
            <p>{t("panelGuideText")}</p>
          </aside>
        </div>

        <StudyActivityMap
          hasError={monthlySummaryError}
          isCurrentMonth={isCurrentMonth}
          isLoading={monthlySummaryLoading}
          month={month}
          onCurrentMonth={showCurrentMonth}
          onNextMonth={showNextMonth}
          onPreviousMonth={showPreviousMonth}
          onYearChange={changeYear}
          summaries={monthlySummaries ?? []}
        />
        <p className="data-note">{t("summariesUpdate")}</p>
      </section>
    </main>
  );
}
