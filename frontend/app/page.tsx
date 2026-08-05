"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppNavigation } from "./components/AppNavigation";
import { formatMinutes } from "../lib/formatters/time";
import { useDailySummary } from "../lib/hooks/useDailySummary";
import {
  createSession,
  updateSessionReflection,
} from "../lib/services/sessions";
import { useCategories } from "../lib/hooks/useCategories";
import { CategoryRequestError } from "../lib/services/categories";

type TimerMode = "focus" | "rest";
type TimerStatus =
  | "ready"
  | "running"
  | "paused"
  | "saving"
  | "save-error"
  | "completed";

type DistractionOption =
  | "noise"
  | "tiredness"
  | "phone"
  | "anxiety"
  | "difficulty"
  | "interruption"
  | "none"
  | "other";

type PersistedTimerState = {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  endAt: number | null;
  focusMinutes: number;
  restMinutes: number;
  sessionGoal: string;
  selectedCategoryId: number | null;
  activeSessionId: number | null;
  focusQuality: number | null;
  distraction: DistractionOption | null;
  distractionNote: string;
  reflectionSkipped: boolean;
  immersiveMode: boolean;
};

const TIMER_STORAGE_KEY = "pomodoro.timer.v1";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;

  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  );
}

const DISTRACTION_OPTIONS: Array<{ value: DistractionOption; label: string }> = [
  { value: "noise", label: "Barulho" },
  { value: "tiredness", label: "Cansaço" },
  { value: "phone", label: "Celular" },
  { value: "anxiety", label: "Ansiedade" },
  { value: "difficulty", label: "Dificuldade" },
  { value: "interruption", label: "Interrupção" },
  { value: "none", label: "Nada" },
  { value: "other", label: "Outro" },
];

function DurationControl({
  label,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="duration-control">
      <span className="duration-label">{label}</span>
      <div className="stepper" aria-label={`${label}: ${value} minutos`}>
        <button
          type="button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          disabled={disabled}
          onClick={() => onChange(Math.max(1, value - 5))}
        >
          −
        </button>
        <strong>{value} min</strong>
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={disabled}
          onClick={() => onChange(Math.min(120, value + 5))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const {
    summary: today,
    hasError: dailySummaryError,
    refresh: refreshDailySummary,
  } = useDailySummary();
  const {
    categories,
    hasError: categoriesError,
    isLoading: categoriesLoading,
    isCreating: isCreatingCategory,
    addCategory,
  } = useCategories();
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [restMinutes, setRestMinutes] = useState(5);
  const [sessionGoal, setSessionGoal] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [status, setStatus] = useState<TimerStatus>("ready");
  const [remainingSeconds, setRemainingSeconds] = useState(focusMinutes * 60);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [focusQuality, setFocusQuality] = useState<number | null>(null);
  const [distraction, setDistraction] = useState<DistractionOption | null>(null);
  const [distractionNote, setDistractionNote] = useState("");
  const [reflectionSkipped, setReflectionSkipped] = useState(false);
  const [reflectionStatus, setReflectionStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [immersiveMode, setImmersiveMode] = useState(false);
  const saveStartedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const totalSeconds = (mode === "focus" ? focusMinutes : restMinutes) * 60;
  const progress = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
  const configurationLocked =
    mode === "rest" ||
    status === "running" ||
    status === "paused" ||
    status === "saving" ||
    status === "save-error";
  const goalLocked =
    mode === "focus" &&
    (status === "running" ||
      status === "paused" ||
      status === "saving" ||
      status === "save-error");
  const dailyGoalMinutes = 75;
  const dailyGoalProgress = Math.min(
    100,
    Math.round(((today?.total_work_time ?? 0) / dailyGoalMinutes) * 100),
  );

  function prepareCompletionSound() {
    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    void audioContextRef.current.resume();
  }

  function announceTimerChange(title: string, body: string) {
    prepareCompletionSound();

    const audioContext = audioContextRef.current;
    if (audioContext) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = 660;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.52);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }

  function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }

  useEffect(() => {
    try {
      const savedState = window.localStorage.getItem(TIMER_STORAGE_KEY);

      if (savedState) {
        const saved = JSON.parse(savedState) as PersistedTimerState;
        const restoredStatus =
          saved.status === "saving" || saved.status === "save-error"
            ? "ready"
            : saved.status;
        const restoredRemaining =
          restoredStatus === "running" && saved.endAt
            ? Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000))
            : saved.remainingSeconds;

        setFocusMinutes(saved.focusMinutes);
        setRestMinutes(saved.restMinutes);
        setSessionGoal(saved.sessionGoal);
        setSelectedCategoryId(saved.selectedCategoryId);
        setActiveSessionId(saved.activeSessionId ?? null);
        setFocusQuality(saved.focusQuality ?? null);
        setDistraction(saved.distraction ?? null);
        setDistractionNote(saved.distractionNote ?? "");
        setReflectionSkipped(saved.reflectionSkipped ?? false);
        setImmersiveMode(saved.immersiveMode ?? false);
        setMode(saved.mode);
        setStatus(restoredStatus);
        setRemainingSeconds(restoredRemaining);
        setEndAt(restoredStatus === "running" ? saved.endAt : null);
      }
    } catch {
      window.localStorage.removeItem(TIMER_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || status !== "running") return;

    function updateRemainingTime() {
      if (!endAt) {
        setEndAt(Date.now() + remainingSeconds * 1000);
        return;
      }
      setRemainingSeconds(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));
    }

    updateRemainingTime();
    const interval = window.setInterval(updateRemainingTime, 250);
    return () => window.clearInterval(interval);
  }, [endAt, isHydrated, status]);

  useEffect(() => {
    if (!isHydrated || status !== "running" || remainingSeconds !== 0) return;

    if (mode === "focus") {
      void saveCompletedFocus();
    } else {
      saveStartedRef.current = false;
      announceTimerChange("Descanso concluído", "Seu próximo foco está pronto.");
      setActiveSessionId(null);
      setFocusQuality(null);
      setDistraction(null);
      setDistractionNote("");
      setReflectionSkipped(false);
      setReflectionStatus("idle");
      setMode("focus");
      setRemainingSeconds(focusMinutes * 60);
      setEndAt(Date.now() + focusMinutes * 60_000);
      setStatus("running");
    }
  }, [focusMinutes, isHydrated, mode, remainingSeconds, status]);

  useEffect(() => {
    if (!isHydrated || status !== "ready") return;
    setRemainingSeconds((mode === "focus" ? focusMinutes : restMinutes) * 60);
  }, [focusMinutes, isHydrated, mode, restMinutes, status]);

  useEffect(() => {
    if (!isHydrated) return;

    const persistedState: PersistedTimerState = {
      mode,
      status,
      remainingSeconds,
      endAt,
      focusMinutes,
      restMinutes,
      sessionGoal,
      selectedCategoryId,
      activeSessionId,
      focusQuality,
      distraction,
      distractionNote,
      reflectionSkipped,
      immersiveMode,
    };

    window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(persistedState));
  }, [
    activeSessionId,
    distraction,
    distractionNote,
    endAt,
    focusMinutes,
    focusQuality,
    immersiveMode,
    isHydrated,
    mode,
    reflectionSkipped,
    restMinutes,
    selectedCategoryId,
    sessionGoal,
    status,
  ]);

  const statusLabel = useMemo(() => {
    if (status === "running") return mode === "focus" ? "Foco em andamento" : "Hora de respirar";
    if (status === "paused") return "Sessão pausada";
    if (status === "saving") return "Salvando sessão";
    if (status === "save-error") return "Não foi possível salvar";
    if (status === "completed") return "Descanso concluído";
    return mode === "focus" ? "Pronto para focar" : "Pronto para descansar";
  }, [mode, status]);

  function selectMode(nextMode: TimerMode) {
    if (
      status === "running" ||
      status === "paused" ||
      status === "saving" ||
      status === "save-error"
    ) return;
    setMode(nextMode);
    setStatus("ready");
    setRemainingSeconds((nextMode === "focus" ? focusMinutes : restMinutes) * 60);
    setEndAt(null);
    setImmersiveMode(false);
  }

  function handlePrimaryAction() {
    if (status === "saving") return;

    if (status === "save-error") {
      void saveCompletedFocus();
      return;
    }

    if (status === "completed") {
      setMode("focus");
      setStatus("ready");
      setRemainingSeconds(focusMinutes * 60);
      setEndAt(null);
      setImmersiveMode(false);
      return;
    }

    if (status === "running") {
      const pausedRemaining = endAt
        ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
        : remainingSeconds;
      setRemainingSeconds(pausedRemaining);
      setEndAt(null);
      setStatus("paused");
      return;
    }

    if (mode === "focus") {
      saveStartedRef.current = false;
    }

    if (status === "ready" || status === "paused") {
      setImmersiveMode(true);
    }
    requestNotificationPermission();
    prepareCompletionSound();
    setEndAt(Date.now() + remainingSeconds * 1000);
    setStatus("running");
  }

  async function saveCompletedFocus() {
    if (saveStartedRef.current) return;

    saveStartedRef.current = true;
    setEndAt(null);
    setStatus("saving");

    try {
      const now = new Date();
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);

      const createdSession = await createSession({
        work_time: focusMinutes,
        rest_time: restMinutes,
        session_date: localDate,
        goal: sessionGoal.trim() || null,
        category_id: selectedCategoryId,
      });

      refreshDailySummary();
      setActiveSessionId(createdSession.id);
      setFocusQuality(null);
      setDistraction(null);
      setDistractionNote("");
      setReflectionSkipped(false);
      setReflectionStatus("idle");
      announceTimerChange("Foco concluído", "O descanso começou automaticamente.");
      setImmersiveMode(false);
      setMode("rest");
      setRemainingSeconds(restMinutes * 60);
      setEndAt(Date.now() + restMinutes * 60_000);
      setStatus("running");
    } catch {
      saveStartedRef.current = false;
      setStatus("save-error");
    }
  }

  function cancelSession() {
    saveStartedRef.current = false;
    setMode("focus");
    setStatus("ready");
    setRemainingSeconds(focusMinutes * 60);
    setEndAt(null);
    setActiveSessionId(null);
    setFocusQuality(null);
    setDistraction(null);
    setDistractionNote("");
    setReflectionSkipped(false);
    setReflectionStatus("idle");
    setImmersiveMode(false);
  }

  async function saveReflection() {
    if (activeSessionId === null || focusQuality === null) return;

    setReflectionStatus("saving");

    try {
      await updateSessionReflection(activeSessionId, {
        focus_quality: focusQuality,
        distraction,
        distraction_note: distraction === "other" ? distractionNote.trim() || null : null,
      });
      setReflectionStatus("saved");
    } catch {
      setReflectionStatus("error");
    }
  }

  async function handleCreateCategory() {
    const normalizedName = newCategoryName.trim();

    if (!normalizedName) {
      setCategoryFormError("Digite um nome para a categoria.");
      return;
    }

    setCategoryFormError(null);

    try {
      const createdCategory = await addCategory(normalizedName);
      setSelectedCategoryId(createdCategory.id);
      setNewCategoryName("");
      setIsCategoryFormOpen(false);
    } catch (error) {
      if (error instanceof CategoryRequestError && error.status === 409) {
        setCategoryFormError("Essa categoria já existe.");
        return;
      }

      setCategoryFormError("Não foi possível criar a categoria.");
    }
  }

  const primaryLabel =
    status === "saving"
      ? "Salvando..."
      : status === "save-error"
        ? "Tentar novamente"
        : status === "completed"
          ? "Nova sessão"
          : status === "running"
            ? "Pausar"
            : status === "paused"
              ? "Continuar"
              : mode === "focus"
                ? "Iniciar foco"
                : "Iniciar descanso";

  return (
    <main className={`app-shell mode-${mode} ${immersiveMode ? "focus-mode" : ""}`}>
      <AppNavigation activePage="timer" />

      <section className="workspace" id="timer">
        <header className="topbar">
          <div>
            <p className="eyebrow">Boa sessão, Gabriel</p>
            <h1>Proteja seu tempo de foco.</h1>
          </div>
          <div className="today-chip" aria-label="Resumo de hoje">
            <span>Hoje</span>
            <strong>{today ? formatMinutes(today.total_work_time) : "—"}</strong>
          </div>
        </header>

        <div className="content-grid">
          <section className="timer-card" aria-labelledby="timer-title">
            {(status === "running" || status === "paused") && (
              <button
                aria-expanded={!immersiveMode}
                aria-label={immersiveMode ? "Mostrar controles" : "Ocultar controles"}
                className="focus-mode-toggle"
                onClick={() => setImmersiveMode((current) => !current)}
                type="button"
              >
                <span aria-hidden="true">{immersiveMode ? "☰" : "×"}</span>
                {immersiveMode ? "Mostrar controles" : "Ocultar controles"}
              </button>
            )}
            <div className="mode-switch" aria-label="Selecionar modo">
              <button
                type="button"
                className={mode === "focus" ? "selected" : ""}
                aria-pressed={mode === "focus"}
                disabled={
                  status === "running" ||
                  status === "paused" ||
                  status === "saving" ||
                  status === "save-error"
                }
                onClick={() => selectMode("focus")}
              >
                Foco
              </button>
              <button
                type="button"
                className={mode === "rest" ? "selected" : ""}
                aria-pressed={mode === "rest"}
                disabled={
                  status === "running" ||
                  status === "paused" ||
                  status === "saving" ||
                  status === "save-error"
                }
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
                  {mode === "focus"
                    ? sessionGoal.trim() || "Mantenha a atenção em uma tarefa"
                    : "Levante, respire e prepare o próximo objetivo"}
                </span>
              </div>
            </div>

            <div className="timer-actions">
              <button
                className="primary-action"
                type="button"
                disabled={status === "saving"}
                onClick={handlePrimaryAction}
              >
                <span>{status === "running" ? "Ⅱ" : "▶"}</span>
                {primaryLabel}
              </button>
              {(status === "running" ||
                status === "paused" ||
                status === "save-error") && (
                <button className="secondary-action" type="button" onClick={cancelSession}>
                  {status === "save-error" ? "Descartar" : "Cancelar"}
                </button>
              )}
            </div>
            {status === "save-error" && (
              <p className="save-feedback" role="alert">
                A sessão terminou, mas a API não respondeu. Tente salvar novamente.
              </p>
            )}
          </section>

          <aside className="side-panel">
            <section className="settings-card" aria-labelledby="duration-title">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Preparar sessão</p>
                  <h2 id="duration-title">Seu próximo foco</h2>
                </div>
                <span className="status-badge">personalizado</span>
              </div>

              <div className="session-category-field">
                <label htmlFor="session-category">
                  {mode === "rest" ? "Categoria do próximo foco" : "Categoria"}
                </label>
                <div className="category-select-row">
                  <select
                    disabled={goalLocked || categoriesLoading || categoriesError}
                    id="session-category"
                    onChange={(event) =>
                      setSelectedCategoryId(
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    value={selectedCategoryId ?? ""}
                  >
                    <option value="">
                      {categoriesLoading
                        ? "Carregando categorias..."
                        : categoriesError
                          ? "Categorias indisponíveis"
                          : "Sem categoria"}
                    </option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={goalLocked || categoriesError}
                    onClick={() => {
                      setCategoryFormError(null);
                      setIsCategoryFormOpen((current) => !current);
                    }}
                    type="button"
                  >
                    {isCategoryFormOpen ? "Fechar" : "+ Nova"}
                  </button>
                </div>

                {isCategoryFormOpen && (
                  <div className="category-create-panel">
                    <input
                      aria-label="Nome da nova categoria"
                      disabled={isCreatingCategory}
                      maxLength={50}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleCreateCategory();
                        }
                      }}
                      placeholder="Ex.: Matemática"
                      type="text"
                      value={newCategoryName}
                    />
                    <button
                      disabled={isCreatingCategory}
                      onClick={() => void handleCreateCategory()}
                      type="button"
                    >
                      {isCreatingCategory ? "Criando..." : "Criar"}
                    </button>
                    {categoryFormError && (
                      <small role="alert">{categoryFormError}</small>
                    )}
                  </div>
                )}
              </div>

              <div className="session-goal-field">
                <label htmlFor="session-goal">
                  {mode === "rest" ? "Objetivo da próxima sessão" : "Objetivo da sessão"}
                </label>
                <textarea
                  disabled={goalLocked}
                  id="session-goal"
                  maxLength={160}
                  onChange={(event) => setSessionGoal(event.target.value)}
                  placeholder="Ex.: revisar consultas com GROUP BY"
                  rows={3}
                  value={sessionGoal}
                />
                <div className="session-goal-meta">
                  <small>{sessionGoal.length}/160 · opcional</small>
                  <button
                    disabled={goalLocked || sessionGoal.length === 0}
                    onClick={() => setSessionGoal("")}
                    type="button"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <DurationControl
                label="Tempo de foco"
                value={focusMinutes}
                disabled={configurationLocked}
                onChange={setFocusMinutes}
              />
              <DurationControl
                label="Descanso"
                value={restMinutes}
                disabled={configurationLocked}
                onChange={setRestMinutes}
              />
              <p className="helper-text">As durações podem ser alteradas antes de iniciar.</p>
            </section>

            {mode === "rest" &&
              status === "running" &&
              activeSessionId !== null &&
              !reflectionSkipped && (
                <section className="reflection-card" aria-labelledby="reflection-title">
                  <div className="card-heading">
                    <div>
                      <p className="eyebrow">Check-in rápido</p>
                      <h2 id="reflection-title">Como foi seu foco?</h2>
                    </div>
                    <span className="status-badge">opcional</span>
                  </div>

                  <div className="reflection-quality" aria-label="Qualidade do foco de zero a cinco">
                    {[0, 1, 2, 3, 4, 5].map((quality) => (
                      <button
                        aria-label={`${quality} de 5 de foco`}
                        aria-pressed={focusQuality === quality}
                        className={focusQuality === quality ? "selected" : ""}
                        key={quality}
                        onClick={() => setFocusQuality(quality)}
                        type="button"
                      >
                        <span aria-hidden="true">{quality === 0 ? "☆" : "★"}</span>
                        <small>{quality}</small>
                      </button>
                    ))}
                  </div>

                  <p className="reflection-question">O que mais atrapalhou?</p>
                  <div className="reflection-options">
                    {DISTRACTION_OPTIONS.map((option) => (
                      <button
                        aria-pressed={distraction === option.value}
                        className={distraction === option.value ? "selected" : ""}
                        key={option.value}
                        onClick={() => setDistraction(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {distraction === "other" && (
                    <input
                      aria-label="Descreva outra distração"
                      className="reflection-note-input"
                      maxLength={160}
                      onChange={(event) => setDistractionNote(event.target.value)}
                      placeholder="Descreva brevemente"
                      value={distractionNote}
                    />
                  )}

                  <div className="reflection-actions">
                    <button
                      className="reflection-save"
                      disabled={focusQuality === null || reflectionStatus === "saving"}
                      onClick={() => void saveReflection()}
                      type="button"
                    >
                      {reflectionStatus === "saving" ? "Salvando..." : "Salvar check-in"}
                    </button>
                    <button
                      className="reflection-skip"
                      disabled={reflectionStatus === "saving"}
                      onClick={() => {
                        setReflectionSkipped(true);
                        setReflectionStatus("idle");
                      }}
                      type="button"
                    >
                      Pular
                    </button>
                  </div>

                  {reflectionStatus === "saved" && (
                    <small className="reflection-feedback">Check-in salvo.</small>
                  )}
                  {reflectionStatus === "error" && (
                    <small className="reflection-feedback error">
                      Não foi possível salvar. Tente novamente.
                    </small>
                  )}
                </section>
              )}

            <section className="progress-card" aria-labelledby="today-title">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Resumo da API</p>
                  <h2 id="today-title">Seu dia</h2>
                </div>
                <strong>
                  {dailySummaryError
                    ? "indisponível"
                    : today
                      ? `${today.session_count} ${
                          today.session_count === 1 ? "sessão" : "sessões"
                        }`
                      : "carregando"}
                </strong>
              </div>
              <div className="goal-row">
                <span>Meta diária de {dailyGoalMinutes} min</span>
                <strong>{dailyGoalProgress}%</strong>
              </div>
              <div
                className="goal-track"
                aria-label={`${dailyGoalProgress}% da meta diária`}
              >
                <span style={{ width: `${dailyGoalProgress}%` }} />
              </div>
              <p className="helper-text">
                As sessões vêm do seu SQLite por meio da primeira rota da API.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
