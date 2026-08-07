"use client";

import { useEffect, useState } from "react";
import { useSessionsByDate } from "../../lib/hooks/useSessionsByDate";
import type { DailySummary } from "../../lib/services/progress";
import { useI18n } from "../../lib/i18n/I18nProvider";

type StudyActivityMapProps = {
  month: string;
  summaries: DailySummary[];
  hasError: boolean;
  isCurrentMonth: boolean;
  isLoading: boolean;
  onCurrentMonth: () => void;
  onNextMonth: () => void;
  onYearChange: (year: number) => void;
  onPreviousMonth: () => void;
};

function getIntensity(minutes: number) {
  if (minutes === 0) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  if (minutes <= 90) return 3;
  return 4;
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

export function StudyActivityMap({
  month,
  summaries,
  hasError,
  isCurrentMonth,
  isLoading,
  onCurrentMonth,
  onNextMonth,
  onYearChange,
  onPreviousMonth,
}: StudyActivityMapProps) {
  const { locale, t } = useI18n();
  const distractionLabels: Record<string, string> = {
    noise: t("distractionNoise"), tiredness: t("distractionTiredness"), phone: t("distractionPhone"),
    anxiety: t("distractionAnxiety"), difficulty: t("distractionDifficulty"),
    interruption: t("distractionInterruption"), none: t("distractionNone"), other: t("distractionOther"),
  };
  const weekdayLabels = locale === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();
  const summariesByDate = new Map(
    summaries.map((summary) => [summary.date, summary]),
  );
  const initialSelection = summaries.at(-1) ?? null;
  const [selectedDay, setSelectedDay] = useState<DailySummary | null>(
    initialSelection,
  );
  const {
    sessions: selectedSessions,
    hasError: sessionsError,
    isLoading: sessionsLoading,
  } = useSessionsByDate(selectedDay?.date ?? null);
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 11 }, (_, index) => currentYear - index);

  useEffect(() => {
    setSelectedDay(summaries.at(-1) ?? null);
  }, [month, summaries]);

  function selectDay(day: number) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    setSelectedDay(
      summariesByDate.get(date) ?? {
        date,
        session_count: 0,
        total_work_time: 0,
      },
    );
  }

  return (
    <section className="activity-card" aria-labelledby="activity-title">
      <div className="activity-heading">
        <div>
          <p className="eyebrow">{t("consistencyMap")}</p>
          <h2 id="activity-title">{t("yourActivityIn")} {monthLabel}</h2>
        </div>

        <div className="activity-header-tools">
          <nav className="activity-navigation" aria-label={t("calendarNavigation")}>
            <button
              aria-label={t("previousMonth")}
              onClick={onPreviousMonth}
              type="button"
            >
              ‹
            </button>
            <button
              disabled={isCurrentMonth}
              onClick={onCurrentMonth}
              type="button"
            >
              {t("currentMonth")}
            </button>
            <button
              aria-label={t("nextMonth")}
              disabled={isCurrentMonth}
              onClick={onNextMonth}
              type="button"
            >
              ›
            </button>
          </nav>
          <label className="activity-year-label">
            {t("year")}
            <select
              aria-label={t("selectCalendarYear")}
              className="activity-year-select"
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
            >
              {availableYears.map((availableYear) => (
                <option key={availableYear} value={availableYear}>{availableYear}</option>
              ))}
            </select>
          </label>

          <div className="activity-legend" aria-label={t("studyIntensity")}>
            <span>{t("less")}</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <i className={`activity-swatch level-${level}`} key={level} />
            ))}
            <span>{t("more")}</span>
          </div>
        </div>
      </div>

      <div className="activity-content" aria-busy={isLoading}>
        <div className="activity-calendar-scroll">
          <div className="activity-calendar">
            <div className="activity-weekdays" aria-hidden="true">
              {weekdayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="activity-grid">
              {calendarCells.map((day, index) => {
                if (day === null) {
                  return <span className="activity-placeholder" key={`empty-${index}`} />;
                }

                const date = `${month}-${String(day).padStart(2, "0")}`;
                const summary = summariesByDate.get(date);
                const minutes = summary?.total_work_time ?? 0;
                const sessions = summary?.session_count ?? 0;
                const tooltip = `${formatDate(date, locale)}: ${sessions} ${
                  sessions === 1 ? t("session") : t("sessions")
                }, ${minutes} min`;

                return (
                  <button
                    aria-label={tooltip}
                    className={`activity-day level-${getIntensity(minutes)} ${
                      selectedDay?.date === date ? "selected" : ""
                    }`}
                    data-tooltip={tooltip}
                    key={date}
                    onClick={() => selectDay(day)}
                    type="button"
                  >
                    <span>{day}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {isLoading && <p className="activity-load-status">{t("loadingMonth")}</p>}
          {hasError && (
            <p className="activity-load-status">{t("noSessionsMonth")}</p>
          )}
        </div>

        <aside className="activity-detail" aria-live="polite">
          {selectedDay ? (
            <>
              <span className="activity-detail-date">{formatDate(selectedDay.date, locale)}</span>
              <div className="activity-detail-row">
                <span>{t("studiedTime")}</span>
                <strong>{selectedDay.total_work_time} min</strong>
              </div>
              <div className="activity-detail-row">
                <span>{t("completedSessions")}</span>
                <strong>{selectedDay.session_count}</strong>
              </div>
              <div className="activity-session-details">
                <span className="activity-session-heading">{t("sessionDetails")}</span>

                {sessionsError ? (
                  <small>{t("noDayRecords")}</small>
                ) : sessionsLoading ? (
                  <small>{t("loadingSessions")}</small>
                ) : selectedSessions && selectedSessions.length > 0 ? (
                  <div className="activity-session-list">
                    {selectedSessions.map((session, index) => (
                      <div className="activity-session-item" key={session.id}>
                        <span>{t("session")} {index + 1}</span>
                        <strong>{session.work_time} min</strong>
                        <span className="activity-session-goal">
                          {session.goal || t("noGoal")}
                        </span>
                        <small>
                          {session.category_name || t("noCategory")} · {session.rest_time} {t("minuteShort")} · {t("rest")}
                        </small>
                        <small>
                          {session.focus_quality === null
                            ? t("noCheckin")
                            : `${t("focus")} ${session.focus_quality}/5${session.distraction ? ` · ${distractionLabels[session.distraction] ?? session.distraction}` : ""}`}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <small>{t("noDaySessions")}</small>
                )}
              </div>
            </>
          ) : (
            <>
              <span>{t("noDaySelected")}</span>
              <strong>—</strong>
              <small>{t("clickDay")}</small>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
