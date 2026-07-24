import { AppNavigation } from "../components/AppNavigation";
import {
  getSessionHistory,
  type StudySession,
} from "../../lib/services/sessions";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
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
  const sessions = getSessionHistory();
  const sessionsByDate = groupSessionsByDate(sessions);
  const totalFocusTime = sessions.reduce(
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
            <p className="eyebrow">Seu caminho até aqui</p>
            <h1>Histórico de sessões.</h1>
          </div>
          <span className="demo-badge">dados demonstrativos</span>
        </header>

        <section className="history-summary" aria-label="Resumo do histórico">
          <div>
            <span>Sessões exibidas</span>
            <strong>{sessions.length}</strong>
          </div>
          <div>
            <span>Tempo de foco</span>
            <strong>{totalFocusTime} min</strong>
          </div>
          <div>
            <span>Dias estudados</span>
            <strong>{studiedDays}</strong>
          </div>
        </section>

        <section className="history-card" aria-labelledby="history-list-title">
          <div className="history-card-heading">
            <div>
              <p className="eyebrow">Sessões recentes</p>
              <h2 id="history-list-title">Atividade registrada</h2>
            </div>
            <span className="history-period">Julho de 2026</span>
          </div>

          {sessions.length > 0 ? (
            <div className="history-groups">
              {Object.entries(sessionsByDate).map(([date, daySessions]) => (
                <section className="history-day" key={date}>
                  <header>
                    <div>
                      <h3>{formatDate(date)}</h3>
                      <span>
                        {daySessions.length}{" "}
                        {daySessions.length === 1 ? "sessão" : "sessões"}
                      </span>
                    </div>
                    <strong>
                      {daySessions.reduce(
                        (total, session) => total + session.work_time,
                        0,
                      )}{" "}
                      min de foco
                    </strong>
                  </header>

                  <div className="history-session-list">
                    {daySessions.map((session, index) => (
                      <article className="history-session" key={session.id}>
                        <div className="history-session-index">
                          <span>{String(index + 1).padStart(2, "0")}</span>
                        </div>
                        <div className="history-session-label">
                          <strong>Sessão de foco</strong>
                          <small>Registro #{session.id}</small>
                        </div>
                        <div className="history-session-metric">
                          <span>Foco</span>
                          <strong>{session.work_time} min</strong>
                        </div>
                        <div className="history-session-metric">
                          <span>Descanso</span>
                          <strong>{session.rest_time} min</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="history-empty">
              <strong>Nenhuma sessão encontrada.</strong>
              <p>Quando você concluir uma sessão, ela aparecerá aqui.</p>
            </div>
          )}
        </section>

        <p className="data-note">
          O filtro por período será adicionado junto com o endpoint de histórico da
          API.
        </p>
      </section>
    </main>
  );
}
