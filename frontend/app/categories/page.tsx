"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNavigation } from "../components/AppNavigation";
import { useCategories } from "../../lib/hooks/useCategories";
import { useSessionsByCategory } from "../../lib/hooks/useSessionsByCategory";
import type { StudySession } from "../../lib/services/sessions";

const DISTRACTION_LABELS: Record<string, string> = {
  noise: "Barulho",
  tiredness: "Cansaço",
  phone: "Celular",
  anxiety: "Ansiedade",
  difficulty: "Dificuldade da matéria",
  interruption: "Interrupção",
  none: "Nenhuma distração",
  other: "Outra distração",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function SessionReflection({ session }: { session: StudySession }) {
  return (
    <div className="category-session-reflection">
      <span>
        {session.focus_quality === null
          ? "Sem check-in"
          : `Foco ${session.focus_quality}/5`}
      </span>
      {session.distraction && (
        <span>{DISTRACTION_LABELS[session.distraction] ?? session.distraction}</span>
      )}
      {session.distraction_note && <p>“{session.distraction_note}”</p>}
    </div>
  );
}

export default function CategoriesPage() {
  const {
    categories,
    hasError: categoriesError,
    isLoading: categoriesLoading,
  } = useCategories();
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
            <p className="eyebrow">Seu mapa de estudos</p>
            <h1>Categorias que mostram seu caminho.</h1>
          </div>
          <span className="demo-badge">dados da API</span>
        </header>

        {categoriesError ? (
          <div className="category-page-empty">
            <strong>Não foi possível carregar suas categorias.</strong>
            <p>Confirme se a API está rodando e atualize a página.</p>
          </div>
        ) : categoriesLoading ? (
          <div className="category-page-empty">
            <strong>Carregando categorias…</strong>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="categories-layout">
            <section className="categories-list-card" aria-labelledby="categories-list-title">
              <div className="categories-card-heading">
                <div>
                  <p className="eyebrow">Áreas de estudo</p>
                  <h2 id="categories-list-title">Suas categorias</h2>
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
                  <p className="eyebrow">Sessões registradas</p>
                  <h2 id="category-detail-title">
                    {selectedCategory?.name ?? "Categoria"}
                  </h2>
                </div>
                <div className="category-detail-stats">
                  <strong>{totalMinutes} min</strong>
                  <span>{loadedSessions.length} sessões · foco médio {averageQuality}</span>
                </div>
              </header>

              {goals.length > 0 && (
                <div className="category-goals-summary">
                  <span>Objetivos registrados</span>
                  <div>
                    {goals.map((goal) => (
                      <span key={goal}>{goal}</span>
                    ))}
                  </div>
                </div>
              )}

              {sessionsError ? (
                <div className="category-page-empty compact">
                  <strong>Não foi possível carregar as sessões.</strong>
                </div>
              ) : sessionsLoading ? (
                <div className="category-page-empty compact">
                  <strong>Carregando sessões…</strong>
                </div>
              ) : loadedSessions.length > 0 ? (
                <div className="category-session-list">
                  {loadedSessions.map((session) => (
                    <article className="category-session" key={session.id}>
                      <div className="category-session-main">
                        <span>{formatDate(session.session_date)}</span>
                        <strong>{session.work_time} min de foco</strong>
                        <small>
                          {session.goal || "Sessão sem objetivo definido"} · {session.rest_time} min de descanso
                        </small>
                      </div>
                      <SessionReflection session={session} />
                    </article>
                  ))}
                </div>
              ) : (
                <div className="category-page-empty compact">
                  <strong>Nenhuma sessão nesta categoria.</strong>
                  <p>Escolha esta categoria ao iniciar seu próximo foco.</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="category-page-empty">
            <strong>Você ainda não tem categorias.</strong>
            <p>Crie uma categoria na tela do temporizador para começar.</p>
          </div>
        )}
      </section>
    </main>
  );
}
