"use client";

import { useEffect, useState } from "react";
import { useSessionsByDate } from "../../lib/hooks/useSessionsByDate";
import type { DailySummary } from "../../lib/services/progress";

type StudyActivityMapProps = {
  month: string;
  summaries: DailySummary[];
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getIntensity(minutes: number) {
  if (minutes === 0) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  if (minutes <= 90) return 3;
  return 4;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

export function StudyActivityMap({
  month,
  summaries,
}: StudyActivityMapProps) {
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
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  useEffect(() => {
    const selectionBelongsToMonth = selectedDay?.date.startsWith(month);
    if ((!selectedDay || !selectionBelongsToMonth) && summaries.length > 0) {
      setSelectedDay(summaries.at(-1) ?? null);
    }
  }, [month, selectedDay, summaries]);

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
          <p className="eyebrow">Mapa de constância</p>
          <h2 id="activity-title">Sua atividade em {monthLabel}</h2>
        </div>

        <div className="activity-legend" aria-label="Intensidade de estudo">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i className={`activity-swatch level-${level}`} key={level} />
          ))}
          <span>Mais</span>
        </div>
      </div>

      <div className="activity-content">
        <div className="activity-calendar-scroll">
          <div className="activity-calendar">
            <div className="activity-weekdays" aria-hidden="true">
              {WEEKDAY_LABELS.map((label) => (
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
                const tooltip = `${formatDate(date)}: ${sessions} ${
                  sessions === 1 ? "sessão" : "sessões"
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
        </div>

        <aside className="activity-detail" aria-live="polite">
          {selectedDay ? (
            <>
              <span className="activity-detail-date">{formatDate(selectedDay.date)}</span>
              <div className="activity-detail-row">
                <span>Tempo estudado</span>
                <strong>{selectedDay.total_work_time} min</strong>
              </div>
              <div className="activity-detail-row">
                <span>Sessões concluídas</span>
                <strong>{selectedDay.session_count}</strong>
              </div>
              <div className="activity-session-details">
                <span className="activity-session-heading">Detalhes das sessões</span>

                {sessionsError ? (
                  <small>Não foi possível consultar os registros.</small>
                ) : sessionsLoading ? (
                  <small>Carregando sessões…</small>
                ) : selectedSessions && selectedSessions.length > 0 ? (
                  <div className="activity-session-list">
                    {selectedSessions.map((session, index) => (
                      <div className="activity-session-item" key={session.id}>
                        <span>Sessão {index + 1}</span>
                        <strong>{session.work_time} min</strong>
                        <span className="activity-session-goal">
                          {session.goal || "Sem objetivo definido"}
                        </span>
                        <small>{session.rest_time} min de descanso</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <small>Nenhuma sessão registrada neste dia.</small>
                )}
              </div>
            </>
          ) : (
            <>
              <span>Nenhum dia selecionado</span>
              <strong>—</strong>
              <small>Clique em um dia para ver os detalhes.</small>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
