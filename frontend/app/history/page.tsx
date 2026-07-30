"use client";

import { AppNavigation } from "../components/AppNavigation";
import { useRecentSessions } from "../../lib/hooks/useRecentSessions";
import type { StudySession } from "../../lib/services/sessions";

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
            <p className="eyebrow">Seu caminho até aqui</p>
            <h1>Histórico de sessões.</h1>
          </div>
          <span className="demo-badge">
            {hasError ? "API indisponível" : isLoading ? "carregando" : "dados reais"}
          </span>
        </header>

        <section className="history-summary" aria-label="Resumo do histórico">
          <div>
            <span>Sessões exibidas</span>
            <strong>{sessions ? sessions.length : "—"}</strong>
          </div>
          <div>
            <span>Tempo de foco</span>
            <strong>{sessions ? `${totalFocusTime} min` : "—"}</strong>
          </div>
          <div>
            <span>Dias estudados</span>
            <strong>{sessions ? studiedDays : "—"}</strong>
          </div>
        </section>

        <section className="history-card" aria-labelledby="history-list-title">
          <div className="history-card-heading">
            <div>
              <p className="eyebrow">Sessões recentes</p>
              <h2 id="history-list-title">Atividade registrada</h2>
            </div>
            <span className="history-period">Até 20 registros</span>
          </div>

          {loadedSessions.length > 0 ? (
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
                          <strong>{session.goal || "Sessão sem objetivo definido"}</strong>
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
          ) : hasError ? (
            <div className="history-empty">
              <strong>Não foi possível acessar a API.</strong>
              <p>Confirme se o `api.py` está rodando e atualize a página.</p>
            </div>
          ) : isLoading ? (
            <div className="history-empty">
              <strong>Carregando seu histórico…</strong>
              <p>Aguardando a resposta da API.</p>
            </div>
          ) : (
            <div className="history-empty">
              <strong>Nenhuma sessão encontrada.</strong>
              <p>Quando você concluir uma sessão, ela aparecerá aqui.</p>
            </div>
          )}
        </section>

        <p className="data-note">
          Os registros desta tela vêm de `GET /sessions/recent?limit=20`.
        </p>
      </section>
    </main>
  );
}
