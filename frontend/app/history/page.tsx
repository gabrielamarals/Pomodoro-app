"use client";

import { AppNavigation } from "../components/AppNavigation";
import { useI18n } from "../../lib/i18n/I18nProvider";
import { useRecentSessions } from "../../lib/hooks/useRecentSessions";
import type { StudySession } from "../../lib/services/sessions";

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function groupSessionsByDate(sessions: StudySession[]) {
  return sessions.reduce<Record<string, StudySession[]>>((groups, session) => {
    groups[session.session_date] ??= [];
    groups[session.session_date].push(session);
    return groups;
  }, {});
}

export default function HistoryPage() {
  const { locale, t } = useI18n();
  const distractionLabels: Record<string, string> = { noise: t("distractionNoise"), tiredness: t("distractionTiredness"), phone: t("distractionPhone"), anxiety: t("distractionAnxiety"), difficulty: t("distractionDifficulty"), interruption: t("distractionInterruption"), none: t("distractionNone"), other: t("distractionOther") };
  const { sessions, hasError, isLoading } = useRecentSessions(20);
  const loadedSessions = sessions ?? [];
  const sessionsByDate = groupSessionsByDate(loadedSessions);
  const totalFocusTime = loadedSessions.reduce(
    (total, session) => total + session.work_time,
    0,
  );
  const studiedDays = Object.keys(sessionsByDate).length;

  return (
    <main className="app-shell">
      <AppNavigation activePage="history" />

      <section className="workspace history-workspace">
        <header className="topbar history-topbar">
          <div>
            <p className="eyebrow">{t("historyEyebrow")}</p>
            <h1>{t("historyTitle")}</h1>
          </div>
          <span className="demo-badge">
            {hasError ? t("noSessionsBadge") : isLoading ? t("loading") : t("realData")}
          </span>
        </header>

        <section className="history-summary" aria-label={t("historySummaryAria")}>
          <div>
            <span>{t("displayedSessions")}</span>
            <strong>{sessions ? sessions.length : "—"}</strong>
          </div>
          <div>
            <span>{t("focusTime")}</span>
            <strong>{sessions ? `${totalFocusTime} min` : "—"}</strong>
          </div>
          <div>
            <span>{t("studiedDays")}</span>
            <strong>{sessions ? studiedDays : "—"}</strong>
          </div>
        </section>

        <section className="history-card" aria-labelledby="history-list-title">
          <div className="history-card-heading">
            <div>
              <p className="eyebrow">{t("recentSessions")}</p>
              <h2 id="history-list-title">{t("recordedActivity")}</h2>
            </div>
            <span className="history-period">{t("upTo20")}</span>
          </div>

          {loadedSessions.length > 0 ? (
            <div className="history-groups">
              {Object.entries(sessionsByDate).map(([date, daySessions]) => (
                <section className="history-day" key={date}>
                  <header>
                    <div>
                      <h3>{formatDate(date, locale)}</h3>
                      <span>
                        {daySessions.length}{" "}
                        {daySessions.length === 1 ? t("session") : t("sessions")}
                      </span>
                    </div>
                    <strong>
                      {daySessions.reduce(
                        (total, session) => total + session.work_time,
                        0,
                      )}{" "}
                      {t("minuteShort")} · {t("focus")}
                    </strong>
                  </header>

                  <div className="history-session-list">
                    {daySessions.map((session, index) => (
                      <article className="history-session" key={session.id}>
                        <div className="history-session-index">
                          <span>{String(index + 1).padStart(2, "0")}</span>
                        </div>
                        <div className="history-session-label">
                          <strong>{session.goal || t("noGoal")}</strong>
                          <small>
                            {session.category_name || t("noCategory")} · {t("record")} #{session.id}
                          </small>
                          <small>
                            {session.focus_quality === null
                              ? t("noCheckin")
                              : `${t("focus")} ${session.focus_quality}/5${session.distraction ? ` · ${distractionLabels[session.distraction] ?? session.distraction}` : ""}`}
                          </small>
                        </div>
                        <div className="history-session-metric">
                          <span>{t("focus")}</span>
                          <strong>{session.work_time} min</strong>
                        </div>
                        <div className="history-session-metric">
                          <span>{t("rest")}</span>
                          <strong>{session.rest_time} min</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : hasError ? (
            <div className="history-empty">
              <strong>{t("noSessionsFound")}</strong>
              <p>{t("signInHistory")}</p>
            </div>
          ) : isLoading ? (
            <div className="history-empty">
              <strong>{t("loadingHistory")}</strong>
              <p>{t("historyWillAppear")}</p>
            </div>
          ) : (
            <div className="history-empty">
              <strong>{t("noSessionsFound")}</strong>
              <p>{t("sessionWillAppear")}</p>
            </div>
          )}
        </section>

      </section>
    </main>
  );
}
