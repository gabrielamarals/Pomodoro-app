"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNavigation } from "../components/AppNavigation";
import { useI18n } from "../../lib/i18n/I18nProvider";
import { useCategories } from "../../lib/hooks/useCategories";
import { useSessionsByCategory } from "../../lib/hooks/useSessionsByCategory";
import type { StudySession } from "../../lib/services/sessions";

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function SessionReflection({ session }: { session: StudySession }) {
  const { t } = useI18n();
  const distractionLabels: Record<string, string> = { noise: t("distractionNoise"), tiredness: t("distractionTiredness"), phone: t("distractionPhone"), anxiety: t("distractionAnxiety"), difficulty: t("distractionDifficulty"), interruption: t("distractionInterruption"), none: t("distractionNone"), other: t("distractionOther") };
  return (
    <div className="category-session-reflection">
      <span>
        {session.focus_quality === null
          ? t("noCheckin")
          : `${t("focus")} ${session.focus_quality}/5`}
      </span>
      {session.distraction && (
        <span>{distractionLabels[session.distraction] ?? session.distraction}</span>
      )}
      {session.distraction_note && <p>“{session.distraction_note}”</p>}
    </div>
  );
}

export default function CategoriesPage() {
  const { locale, t } = useI18n();
  const {
    categories,
    hasError: categoriesError,
    isLoading: categoriesLoading,
  } = useCategories(locale);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const {
    sessions,
    hasError: sessionsError,
    isLoading: sessionsLoading,
  } = useSessionsByCategory(selectedCategoryId);

  useEffect(() => {
    if (selectedCategoryId === null && categories && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const selectedCategory = categories?.find(
    (category) => category.id === selectedCategoryId,
  );
  const loadedSessions = sessions ?? [];
  const totalMinutes = loadedSessions.reduce(
    (total, session) => total + session.work_time,
    0,
  );
  const qualityValues = loadedSessions
    .map((session) => session.focus_quality)
    .filter((quality): quality is number => quality !== null);
  const averageQuality = qualityValues.length
    ? (qualityValues.reduce((total, quality) => total + quality, 0) / qualityValues.length).toFixed(1)
    : "—";
  const goals = useMemo(
    () =>
      Array.from(
        new Set(loadedSessions.map((session) => session.goal).filter(Boolean)),
      ) as string[],
    [loadedSessions],
  );

  return (
    <main className="app-shell">
      <AppNavigation activePage="categories" />

      <section className="workspace categories-workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t("categoriesEyebrow")}</p>
            <h1>{t("categoriesTitle")}</h1>
          </div>
          <span className="demo-badge">{t("yourSpace")}</span>
        </header>

        {categoriesError ? (
          <div className="category-page-empty">
            <strong>{t("noCategories")}</strong>
            <p>{t("signInCategories")}</p>
          </div>
        ) : categoriesLoading ? (
          <div className="category-page-empty">
            <strong>{t("loadingCategories")}</strong>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="categories-layout">
            <section className="categories-list-card" aria-labelledby="categories-list-title">
              <div className="categories-card-heading">
                <div>
                  <p className="eyebrow">{t("studyAreas")}</p>
                  <h2 id="categories-list-title">{t("yourCategories")}</h2>
                </div>
                <span>{categories.length}</span>
              </div>
              <div className="categories-list">
                {categories.map((category) => (
                  <button
                    className={selectedCategoryId === category.id ? "selected" : ""}
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    type="button"
                  >
                    <span className="category-list-mark">{category.name.slice(0, 1)}</span>
                    <span>{category.name}</span>
                    <span aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="category-detail-card" aria-labelledby="category-detail-title">
              <header className="category-detail-heading">
                <div>
                  <p className="eyebrow">{t("recordedSessions")}</p>
                  <h2 id="category-detail-title">
                    {selectedCategory?.name ?? t("category")}
                  </h2>
                </div>
                <div className="category-detail-stats">
                  <strong>{totalMinutes} min</strong>
                  <span>{loadedSessions.length} {loadedSessions.length === 1 ? t("session") : t("sessions")} · {t("averageFocus")} {averageQuality}</span>
                </div>
              </header>

              {goals.length > 0 && (
                <div className="category-goals-summary">
                  <span>{t("recordedGoals")}</span>
                  <div>
                    {goals.map((goal) => (
                      <span key={goal}>{goal}</span>
                    ))}
                  </div>
                </div>
              )}

              {sessionsError ? (
                <div className="category-page-empty compact">
                  <strong>{t("noCategorySessions")}</strong>
                </div>
              ) : sessionsLoading ? (
                <div className="category-page-empty compact">
                  <strong>{t("loadingSessions")}</strong>
                </div>
              ) : loadedSessions.length > 0 ? (
                <div className="category-session-list">
                  {loadedSessions.map((session) => (
                    <article className="category-session" key={session.id}>
                      <div className="category-session-main">
                        <span>{formatDate(session.session_date, locale)}</span>
                        <strong>{session.work_time} {t("minuteShort")} · {t("focus")}</strong>
                        <small>
                          {session.goal || t("noGoal")} · {session.rest_time} {t("minuteShort")} · {t("rest")}
                        </small>
                      </div>
                      <SessionReflection session={session} />
                    </article>
                  ))}
                </div>
              ) : (
                <div className="category-page-empty compact">
                  <strong>{t("noCategorySessions")}</strong>
                  <p>{t("chooseCategoryNext")}</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="category-page-empty">
            <strong>{t("noCategories")}</strong>
            <p>{t("createCategoryTimer")}</p>
          </div>
        )}
      </section>
    </main>
  );
}
