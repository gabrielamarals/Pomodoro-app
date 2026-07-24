import { AppNavigation } from "../components/AppNavigation";
import { StudyActivityMap } from "../components/StudyActivityMap";
import {
  getDailySummary,
  getMonthlySummary,
  getProgressOverview,
  getWeeklySummary,
} from "../../lib/services/progress";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

export default function ProgressPage() {
  const today = getDailySummary();
  const week = getWeeklySummary();
  const month = getMonthlySummary();
  const overview = getProgressOverview();
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
          <article className="stat-card stat-card-featured">
            <span>Estudo hoje</span>
            <strong>{formatMinutes(today.total_work_time)}</strong>
            <small>{today.session_count} sessões concluídas</small>
          </article>
          <article className="stat-card">
            <span>Esta semana</span>
            <strong>{formatMinutes(overview.weekly_total)}</strong>
            <small>{comparison}% acima da semana anterior</small>
          </article>
          <article className="stat-card">
            <span>Este mês</span>
            <strong>{formatMinutes(overview.monthly_total)}</strong>
            <small>tempo total de foco</small>
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

        <StudyActivityMap month="2026-07" summaries={month} />

        <p className="data-note">
          Os números desta tela são temporários. Quando sua API estiver pronta, apenas o
          serviço de dados será substituído.
        </p>
      </section>
    </main>
  );
}
