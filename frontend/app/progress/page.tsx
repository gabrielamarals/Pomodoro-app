"use client";

import { AppNavigation } from "../components/AppNavigation";
import { StudyActivityMap } from "../components/StudyActivityMap";
import { TodaySummaryCard } from "../components/TodaySummaryCard";
import { formatMinutes } from "../../lib/formatters/time";
import { useMonthlySummary } from "../../lib/hooks/useMonthlySummary";
import { useWeeklySummary } from "../../lib/hooks/useWeeklySummary";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function ProgressPage() {
  const {
    currentWeek,
    weeklyTotal,
    previousWeekTotal,
    hasError: weeklySummaryError,
    isLoading: weeklySummaryLoading,
  } = useWeeklySummary();
  const week = currentWeek ?? [];
  const {
    month,
    summaries: monthlySummaries,
    hasError: monthlySummaryError,
    isLoading: monthlySummaryLoading,
    isCurrentMonth,
    showPreviousMonth,
    showNextMonth,
    showCurrentMonth,
  } = useMonthlySummary();
  const monthlyTotal = (monthlySummaries ?? []).reduce(
    (total, day) => total + day.total_work_time,
    0,
  );
  const highestDay = Math.max(...week.map((day) => day.total_work_time), 1);
  const comparison =
    previousWeekTotal > 0
      ? Math.round(((weeklyTotal - previousWeekTotal) / previousWeekTotal) * 100)
      : null;
  const weeklyStatus = weeklySummaryError
    ? "API indisponível"
    : weeklySummaryLoading
      ? "carregando..."
      : comparison === null
        ? "sem base na semana anterior"
        : `${Math.abs(comparison)}% ${comparison >= 0 ? "acima" : "abaixo"} da semana anterior`;

  return (
    <main className="app-shell">
      <AppNavigation activePage="progress" />

      <section className="workspace progress-workspace">
        <header className="topbar progress-topbar">
          <div>
            <p className="eyebrow">Seu ritmo de estudos</p>
            <h1>Progresso que você consegue enxergar.</h1>
          </div>
          <span className="demo-badge">conectado à API</span>
        </header>

        <section className="stats-grid" aria-label="Resumo de progresso">
          <TodaySummaryCard />
          <article className="stat-card">
            <span>Esta semana</span>
            <strong>{weeklySummaryLoading ? "—" : formatMinutes(weeklyTotal)}</strong>
            <small>{weeklyStatus}</small>
          </article>
          <article className="stat-card">
            <span>Mês exibido</span>
            <strong>
              {monthlySummaryLoading ? "—" : formatMinutes(monthlyTotal)}
            </strong>
            <small>
              {monthlySummaryError ? "API indisponível" : "tempo no mês selecionado"}
            </small>
          </article>
          <article className="stat-card">
            <span>Sequência atual</span>
            <strong>—</strong>
            <small>em desenvolvimento</small>
          </article>
        </section>

        <div className="progress-grid">
          <section className="chart-card" aria-labelledby="weekly-chart-title">
            <div className="progress-card-heading">
              <div>
                <p className="eyebrow">Semana atual</p>
                <h2 id="weekly-chart-title">Ritmo semanal</h2>
              </div>
              <strong>{weeklySummaryLoading ? "—" : formatMinutes(weeklyTotal)}</strong>
            </div>

            <div className="weekly-chart">
              {week.map((day) => {
                const date = new Date(`${day.date}T12:00:00`);
                const height = Math.max(
                  day.total_work_time === 0 ? 4 : 16,
                  (day.total_work_time / highestDay) * 100,
                );

                return (
                  <div className="chart-column" key={day.date}>
                    <span className="chart-value">
                      {day.total_work_time ? day.total_work_time : "—"}
                    </span>
                    <div className="chart-track">
                      <span style={{ height: `${height}%` }} />
                    </div>
                    <small>{DAY_LABELS[date.getDay()]}</small>
                  </div>
                );
              })}
              {weeklySummaryError && (
                <p className="weekly-chart-message">Não foi possível carregar a semana.</p>
              )}
              {weeklySummaryLoading && (
                <p className="weekly-chart-message">Carregando dados semanais...</p>
              )}
            </div>
          </section>

          <aside className="insight-card">
            <p className="eyebrow">Comparação</p>
            <h2>
              {comparison === null
                ? "Sua comparação começa aqui."
                : comparison >= 0
                  ? "Você avançou nesta semana."
                  : "Cada semana tem seu próprio ritmo."}
            </h2>
            <strong className="comparison-value">
              {comparison === null ? "—" : `${comparison > 0 ? "+" : ""}${comparison}%`}
            </strong>
            <p>
              {comparison === null
                ? "Complete sessões em semanas diferentes para acompanhar sua evolução."
                : `${formatMinutes(Math.abs(weeklyTotal - previousWeekTotal))} ${weeklyTotal >= previousWeekTotal ? "a mais" : "a menos"} que na semana anterior.`}
            </p>
            <div className="comparison-lines">
              <div>
                <span>Semana atual</span>
                <strong>{formatMinutes(weeklyTotal)}</strong>
              </div>
              <div>
                <span>Semana anterior</span>
                <strong>{formatMinutes(previousWeekTotal)}</strong>
              </div>
            </div>
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
          summaries={monthlySummaries ?? []}
        />

        <p className="data-note">
          Resumos diário, semanal e mensal carregados diretamente da sua API. A sequência
          de estudos será o próximo dado a ser integrado.
        </p>
      </section>
    </main>
  );
}
