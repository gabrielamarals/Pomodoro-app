"use client";

import { AppNavigation } from "../components/AppNavigation";
import { StudyActivityMap } from "../components/StudyActivityMap";
import { TodaySummaryCard } from "../components/TodaySummaryCard";
import { formatMinutes } from "../../lib/formatters/time";
import { useMonthlySummary } from "../../lib/hooks/useMonthlySummary";
import {
  getProgressOverview,
  getWeeklySummary,
} from "../../lib/services/progress";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function ProgressPage() {
  const week = getWeeklySummary();
  const {
    month,
    summaries: monthlySummaries,
    hasError: monthlySummaryError,
  } = useMonthlySummary();
  const overview = getProgressOverview();
  const monthlyTotal = (monthlySummaries ?? []).reduce(
    (total, day) => total + day.total_work_time,
    0,
  );
  const highestDay = Math.max(...week.map((day) => day.total_work_time), 1);
  const comparison = Math.round(
    ((overview.weekly_total - overview.previous_week_total) /
      overview.previous_week_total) *
      100,
  );

  return (
    <main className="app-shell">
      <AppNavigation activePage="progress" />

      <section className="workspace progress-workspace">
        <header className="topbar progress-topbar">
          <div>
            <p className="eyebrow">Seu ritmo de estudos</p>
            <h1>Progresso que você consegue enxergar.</h1>
          </div>
          <span className="demo-badge">dados demonstrativos</span>
        </header>

        <section className="stats-grid" aria-label="Resumo de progresso">
          <TodaySummaryCard />
          <article className="stat-card">
            <span>Esta semana</span>
            <strong>{formatMinutes(overview.weekly_total)}</strong>
            <small>{comparison}% acima da semana anterior</small>
          </article>
          <article className="stat-card">
            <span>Este mês</span>
            <strong>
              {monthlySummaries ? formatMinutes(monthlyTotal) : "—"}
            </strong>
            <small>
              {monthlySummaryError ? "API indisponível" : "tempo real de foco"}
            </small>
          </article>
          <article className="stat-card">
            <span>Sequência atual</span>
            <strong>{overview.current_streak} dias</strong>
            <small>estudando com consistência</small>
          </article>
        </section>

        <div className="progress-grid">
          <section className="chart-card" aria-labelledby="weekly-chart-title">
            <div className="progress-card-heading">
              <div>
                <p className="eyebrow">Últimos sete dias</p>
                <h2 id="weekly-chart-title">Ritmo semanal</h2>
              </div>
              <strong>{formatMinutes(overview.weekly_total)}</strong>
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
            </div>
          </section>

          <aside className="insight-card">
            <p className="eyebrow">Comparação</p>
            <h2>Você avançou nesta semana.</h2>
            <strong className="comparison-value">+{comparison}%</strong>
            <p>
              Foram {formatMinutes(overview.weekly_total - overview.previous_week_total)} a
              mais que na semana anterior.
            </p>
            <div className="comparison-lines">
              <div>
                <span>Semana atual</span>
                <strong>{formatMinutes(overview.weekly_total)}</strong>
              </div>
              <div>
                <span>Semana anterior</span>
                <strong>{formatMinutes(overview.previous_week_total)}</strong>
              </div>
            </div>
          </aside>
        </div>

        <StudyActivityMap month={month} summaries={monthlySummaries ?? []} />

        <p className="data-note">
          Os números desta tela são temporários. Quando sua API estiver pronta, apenas o
          serviço de dados será substituído.
        </p>
      </section>
    </main>
  );
}
