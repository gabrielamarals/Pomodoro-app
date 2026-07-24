"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNavigation } from "./components/AppNavigation";
import { getDailySummary } from "../lib/services/progress";

type TimerMode = "focus" | "rest";
type TimerStatus = "ready" | "running" | "paused" | "completed";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function DurationControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="duration-control">
      <span className="duration-label">{label}</span>
      <div className="stepper" aria-label={`${label}: ${value} minutos`}>
        <button
          type="button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(1, value - 5))}
        >
          −
        </button>
        <strong>{value} min</strong>
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(120, value + 5))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const today = getDailySummary();
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [restMinutes, setRestMinutes] = useState(5);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [status, setStatus] = useState<TimerStatus>("ready");
  const [remainingSeconds, setRemainingSeconds] = useState(focusMinutes * 60);

  const totalSeconds = (mode === "focus" ? focusMinutes : restMinutes) * 60;
  const progress = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));

  useEffect(() => {
    if (status !== "running") return;

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== "running" || remainingSeconds !== 0) return;

    if (mode === "focus") {
      setMode("rest");
      setRemainingSeconds(restMinutes * 60);
      setStatus("ready");
    } else {
      setStatus("completed");
    }
  }, [mode, remainingSeconds, restMinutes, status]);

  useEffect(() => {
    if (status !== "ready") return;
    setRemainingSeconds((mode === "focus" ? focusMinutes : restMinutes) * 60);
  }, [focusMinutes, mode, restMinutes, status]);

  const statusLabel = useMemo(() => {
    if (status === "running") return mode === "focus" ? "Foco em andamento" : "Hora de respirar";
    if (status === "paused") return "Sessão pausada";
    if (status === "completed") return "Descanso concluído";
    return mode === "focus" ? "Pronto para focar" : "Pronto para descansar";
  }, [mode, status]);

  function selectMode(nextMode: TimerMode) {
    if (status === "running" || status === "paused") return;
    setMode(nextMode);
    setStatus("ready");
    setRemainingSeconds((nextMode === "focus" ? focusMinutes : restMinutes) * 60);
  }

  function handlePrimaryAction() {
    if (status === "running") {
      setStatus("paused");
      return;
    }

    setStatus("running");
  }

  function cancelSession() {
    setMode("focus");
    setStatus("ready");
    setRemainingSeconds(focusMinutes * 60);
  }

  const primaryLabel =
    status === "running"
      ? "Pausar"
      : status === "paused"
        ? "Continuar"
        : mode === "focus"
          ? "Iniciar foco"
          : "Iniciar descanso";

  return (
    <main className={`app-shell mode-${mode}`}>
      <AppNavigation activePage="timer" />

      <section className="workspace" id="timer">
        <header className="topbar">
          <div>
            <p className="eyebrow">Boa sessão, Gabriel</p>
            <h1>Proteja seu tempo de foco.</h1>
          </div>
          <div className="today-chip" aria-label="Resumo demonstrativo de hoje">
            <span>Hoje</span>
            <strong>{today.total_work_time} min</strong>
          </div>
        </header>

        <div className="content-grid">
          <section className="timer-card" aria-labelledby="timer-title">
            <div className="mode-switch" aria-label="Selecionar modo">
              <button
                type="button"
                className={mode === "focus" ? "selected" : ""}
                aria-pressed={mode === "focus"}
                disabled={status === "running" || status === "paused"}
                onClick={() => selectMode("focus")}
              >
                Foco
              </button>
              <button
                type="button"
                className={mode === "rest" ? "selected" : ""}
                aria-pressed={mode === "rest"}
                disabled={status === "running" || status === "paused"}
                onClick={() => selectMode("rest")}
              >
                Descanso
              </button>
            </div>

            <div
              className="timer-ring"
              style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}
            >
              <div className="timer-face">
                <span className="timer-status" id="timer-title">{statusLabel}</span>
                <strong className="timer-value" aria-live="polite">
                  {formatTime(remainingSeconds)}
                </strong>
                <span className="timer-caption">
                  {mode === "focus" ? "Mantenha a atenção em uma tarefa" : "Levante, respire e recarregue"}
                </span>
              </div>
            </div>

            <div className="timer-actions">
              <button className="primary-action" type="button" onClick={handlePrimaryAction}>
                <span>{status === "running" ? "Ⅱ" : "▶"}</span>
                {primaryLabel}
              </button>
              {(status === "running" || status === "paused") && (
                <button className="secondary-action" type="button" onClick={cancelSession}>
                  Cancelar
                </button>
              )}
            </div>
          </section>

          <aside className="side-panel">
            <section className="settings-card" aria-labelledby="duration-title">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Preparar sessão</p>
                  <h2 id="duration-title">Durações</h2>
                </div>
                <span className="status-badge">personalizado</span>
              </div>

              <DurationControl label="Tempo de foco" value={focusMinutes} onChange={setFocusMinutes} />
              <DurationControl label="Descanso" value={restMinutes} onChange={setRestMinutes} />
              <p className="helper-text">As durações podem ser alteradas antes de iniciar.</p>
            </section>

            <section className="progress-card" aria-labelledby="today-title">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Resumo demonstrativo</p>
                  <h2 id="today-title">Seu dia</h2>
                </div>
                <strong>{today.session_count} sessões</strong>
              </div>
              <div className="goal-row">
                <span>Meta diária</span>
                <strong>67%</strong>
              </div>
              <div className="goal-track" aria-label="67% da meta diária">
                <span style={{ width: "67%" }} />
              </div>
              <p className="helper-text">Estes dados são temporários até a API estar pronta.</p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
