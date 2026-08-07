"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNavigation } from "./components/AppNavigation";
import { formatMinutes } from "../lib/formatters/time";
import { useDailySummary } from "../lib/hooks/useDailySummary";
import {
  createSession,
  fetchSessionByClientId,
  SessionRequestError,
  updateSessionReflection,
} from "../lib/services/sessions";
import { useCategories } from "../lib/hooks/useCategories";
import { CategoryRequestError } from "../lib/services/categories";
import { useCurrentAccount } from "../lib/hooks/useCurrentAccount";
import { useI18n } from "../lib/i18n/I18nProvider";

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
  clientSessionId: string | null;
};

const TIMER_STORAGE_PREFIX = "pomodoro.timer.v2";

function createClientSessionId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

async function createSessionReliably(
  session: Parameters<typeof createSession>[0],
) {
  try {
    return await createSession(session);
  } catch (error) {
    const isTransientFailure =
      !(error instanceof SessionRequestError) || error.status >= 500;
    if (!isTransientFailure) throw error;

    await new Promise((resolve) => window.setTimeout(resolve, 500));
    try {
      return await createSession(session);
    } catch (retryError) {
      try {
        const confirmedSession = await fetchSessionByClientId(
          session.client_session_id,
        );
        if (confirmedSession) return confirmedSession;
      } catch {
        // Preserve the original retry failure if confirmation is unavailable.
      }
      throw retryError;
    }
  }
}

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
  const { t } = useI18n();
  const increase = () => onChange(value === 1 ? 5 : Math.min(120, value + 5));
  const decrease = () => onChange(value <= 5 ? 1 : value - 5);

  return (
    <div className="duration-control">
      <span className="duration-label">{label}</span>
      <div className="stepper" aria-label={`${label}: ${value} ${t("minutes")}`}>
        <button
          type="button"
          aria-label={`${t("decrease")} ${label.toLowerCase()}`}
          disabled={disabled}
          onClick={decrease}
        >
          −
        </button>
        <strong>{value} {t("minuteShort")}</strong>
        <button
          type="button"
          aria-label={`${t("increase")} ${label.toLowerCase()}`}
          disabled={disabled}
          onClick={increase}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { account, isLoading: accountLoading } = useCurrentAccount();
  const { locale, t } = useI18n();
  const distractionOptions: Array<{ value: DistractionOption; label: string }> = [
    { value: "noise", label: t("distractionNoise") }, { value: "tiredness", label: t("distractionTiredness") },
    { value: "phone", label: t("distractionPhone") }, { value: "anxiety", label: t("distractionAnxiety") },
    { value: "difficulty", label: t("distractionDifficulty") }, { value: "interruption", label: t("distractionInterruption") },
    { value: "none", label: t("distractionNone") }, { value: "other", label: t("distractionOther") },
  ];
  const {
    summary: today,
    hasError: dailySummaryError,
    addCompletedSession,
  } = useDailySummary();
  const {
    categories,
    hasError: categoriesError,
    isLoading: categoriesLoading,
    isCreating: isCreatingCategory,
    addCategory,
  } = useCategories(locale);
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
  const [saveErrorStatus, setSaveErrorStatus] = useState<number | null>(null);
  const [savedWithoutCategory, setSavedWithoutCategory] = useState(false);
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [clientSessionId, setClientSessionId] = useState<string | null>(null);
  const saveStartedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerStorageKey = useMemo(
    () => `${TIMER_STORAGE_PREFIX}:${account?.user.id ?? "guest"}`,
    [account?.user.id],
  );

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
    if (account?.preferences.sound_enabled !== false) prepareCompletionSound();

    const audioContext = audioContextRef.current;
    if (audioContext && account?.preferences.sound_enabled !== false) {
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

    if (account?.preferences.notifications_enabled !== false && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }

  function requestNotificationPermission() {
    if (account?.preferences.notifications_enabled === false) return;
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }

  useEffect(() => {
    if (accountLoading) return;
    setIsHydrated(false);
    try {
      const savedState = window.localStorage.getItem(timerStorageKey);

      if (savedState) {
        const saved = JSON.parse(savedState) as PersistedTimerState;
        const restoredStatus = saved.status === "saving" ? "save-error" : saved.status;
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
        setClientSessionId(saved.clientSessionId ?? null);
        setMode(saved.mode);
        setStatus(restoredStatus);
        setRemainingSeconds(restoredRemaining);
        setEndAt(restoredStatus === "running" ? saved.endAt : null);
      } else {
        const defaultFocus = account?.preferences.focus_minutes ?? 25;
        const defaultRest = account?.preferences.rest_minutes ?? 5;
        setFocusMinutes(defaultFocus);
        setRestMinutes(defaultRest);
        setSessionGoal("");
        setSelectedCategoryId(null);
        setActiveSessionId(null);
        setFocusQuality(null);
        setDistraction(null);
        setDistractionNote("");
        setReflectionSkipped(false);
        setImmersiveMode(false);
        setClientSessionId(null);
        setSaveErrorStatus(null);
        setSavedWithoutCategory(false);
        setMode("focus");
        setStatus("ready");
        setRemainingSeconds(defaultFocus * 60);
        setEndAt(null);
      }
    } catch {
      window.localStorage.removeItem(timerStorageKey);
    } finally {
      setIsHydrated(true);
    }
  }, [account, accountLoading, timerStorageKey]);

  useEffect(() => {
    if (!categories || selectedCategoryId === null) return;
    if (!categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

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
      // The declaration is hoisted; completion is guarded by saveStartedRef.
      // eslint-disable-next-line react-hooks/immutability
      void saveCompletedFocus();
    } else {
      saveStartedRef.current = false;
      announceTimerChange(t("breakFinishedTitle"), t("nextFocusReady"));
      setActiveSessionId(null);
      setFocusQuality(null);
      setDistraction(null);
      setDistractionNote("");
      setReflectionSkipped(false);
      setReflectionStatus("idle");
      setClientSessionId(createClientSessionId());
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
      clientSessionId,
    };

    window.localStorage.setItem(timerStorageKey, JSON.stringify(persistedState));
  }, [
    activeSessionId,
    clientSessionId,
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
    timerStorageKey,
  ]);

  const statusLabel = useMemo(() => {
    if (status === "running") return mode === "focus" ? t("focusInProgress") : t("timeToBreathe");
    if (status === "paused") return t("paused");
    if (status === "saving") return t("savingSession");
    if (status === "save-error") return t("saveFailed");
    if (status === "completed") return t("breakCompleted");
    return mode === "focus" ? t("readyToFocus") : t("readyToRest");
  }, [mode, status, t]);

  useEffect(() => {
    if (!isHydrated) return;

    const defaultTitle = t("appTitle");
    const isTimerActive = status === "running" || status === "paused";

    if (!isTimerActive) {
      document.title = defaultTitle;
      return;
    }

    const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
    const seconds = String(remainingSeconds % 60).padStart(2, "0");
    const modeLabel = mode === "focus" ? t("focus") : t("rest");
    document.title = `${minutes}:${seconds} · ${modeLabel} | Foco`;

    return () => {
      document.title = defaultTitle;
    };
  }, [isHydrated, mode, remainingSeconds, status, t]);

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

    if (!accountLoading && !account) {
      router.push("/login");
      return;
    }

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
      if (status === "ready" && !clientSessionId) {
        setClientSessionId(createClientSessionId());
      }
    }

    if (status === "ready" || status === "paused") {
      setImmersiveMode(true);
    }
    requestNotificationPermission();
    if (account?.preferences.sound_enabled !== false) prepareCompletionSound();
    setEndAt(Date.now() + remainingSeconds * 1000);
    setStatus("running");
  }

  async function saveCompletedFocus() {
    if (saveStartedRef.current) return;

    saveStartedRef.current = true;
    setEndAt(null);
    setStatus("saving");
    setSaveErrorStatus(null);
    setSavedWithoutCategory(false);

    try {
      const now = new Date();
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);

      const sessionData = {
        work_time: focusMinutes,
        rest_time: restMinutes,
        session_date: localDate,
        goal: sessionGoal.trim() || null,
        category_id: selectedCategoryId,
        client_session_id: clientSessionId ?? createClientSessionId(),
      };

      if (!clientSessionId) setClientSessionId(sessionData.client_session_id);

      let createdSession;
      try {
        createdSession = await createSessionReliably(sessionData);
      } catch (error) {
        const categoryIsInvalid =
          error instanceof SessionRequestError &&
          error.status === 422 &&
          selectedCategoryId !== null &&
          error.detail === "Category does not exist.";

        if (!categoryIsInvalid) throw error;

        createdSession = await createSessionReliably({ ...sessionData, category_id: null });
        setSelectedCategoryId(null);
        setSavedWithoutCategory(true);
      }

      addCompletedSession(focusMinutes);
      setActiveSessionId(createdSession.id);
      setFocusQuality(null);
      setDistraction(null);
      setDistractionNote("");
      setReflectionSkipped(false);
      setReflectionStatus("idle");
      setClientSessionId(null);
      announceTimerChange(t("focusFinishedTitle"), t("autoRestStarted"));
      setImmersiveMode(false);
      setMode("rest");
      setRemainingSeconds(restMinutes * 60);
      setEndAt(Date.now() + restMinutes * 60_000);
      setStatus("running");
    } catch (error) {
      saveStartedRef.current = false;
      setSaveErrorStatus(
        error instanceof SessionRequestError ? error.status : 0,
      );
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
    setClientSessionId(null);
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
      setCategoryFormError(t("categoryNameRequired"));
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
        setCategoryFormError(t("goalExists"));
        return;
      }

      setCategoryFormError(t("categoryCreateError"));
    }
  }

  const primaryLabel =
    status === "saving"
      ? t("saving")
      : status === "save-error"
        ? t("retry")
        : status === "completed"
          ? t("newSession")
          : status === "running"
            ? t("pause")
            : status === "paused"
              ? t("continue")
              : !accountLoading && !account
                ? t("signInToStart")
                : mode === "focus"
                ? t("startFocus")
                : t("startRest");

  return (
    <main className={`app-shell mode-${mode} ${immersiveMode ? "focus-mode" : ""}`}>
      <AppNavigation activePage="timer" />

      <section className="workspace" id="timer">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t("greeting")}{account?.profile.display_name ? `, ${account.profile.display_name}` : ""}</p>
            <h1>{t("focusPageTitle")}</h1>
          </div>
          <div className="today-chip" aria-label={t("todaySummary")}>
            <span>{t("today")}</span>
            <strong>{today ? formatMinutes(today.total_work_time) : "—"}</strong>
          </div>
        </header>

        <div className="content-grid">
          <section className="timer-card" aria-labelledby="timer-title">
            <div className="timer-toolbar">
              <div className="mode-switch" aria-label={t("selectMode")}>
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
                  {t("focus")}
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
                  {t("rest")}
                </button>
              </div>
              {(status === "running" || status === "paused") && (
                <button
                  aria-expanded={!immersiveMode}
                  aria-label={immersiveMode ? t("showControls") : t("hideControls")}
                  className="focus-mode-toggle"
                  onClick={() => setImmersiveMode((current) => !current)}
                  type="button"
                >
                  <span aria-hidden="true">{immersiveMode ? "☰" : "×"}</span>
                  <span>{immersiveMode ? t("showControls") : t("hideControls")}</span>
                </button>
              )}
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
                    ? sessionGoal.trim() || t("focusCaption")
                    : t("restCaption")}
                </span>
              </div>
            </div>

            <div className="timer-actions">
              <button
                className="primary-action"
                type="button"
                disabled={status === "saving" || accountLoading}
                onClick={handlePrimaryAction}
              >
                <span>{status === "running" ? "Ⅱ" : "▶"}</span>
                {primaryLabel}
              </button>
              {(status === "running" ||
                status === "paused" ||
                status === "save-error") && (
                <button className="secondary-action" type="button" onClick={cancelSession}>
                  {status === "save-error" ? t("discard") : t("cancel")}
                </button>
              )}
            </div>
            {status === "save-error" && (
              <p className="save-feedback" role="alert">
                {saveErrorStatus === 401
                  ? t("sessionSaveAuthError")
                  : saveErrorStatus === 422
                    ? t("sessionSaveCategoryError")
                    : t("sessionSaveError")}
              </p>
            )}
            {savedWithoutCategory && (
              <p className="save-notice" role="status">
                {t("sessionSavedWithoutCategory")}
              </p>
            )}
          </section>

          <aside className="side-panel">
            <section className="settings-card" aria-labelledby="duration-title">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">{t("preparingSession")}</p>
                  <h2 id="duration-title">{t("nextFocus")}</h2>
                </div>
                <span className="status-badge">{t("customized")}</span>
              </div>

              <div className="session-category-field">
                <label htmlFor="session-category">
                  {mode === "rest" ? t("nextFocusCategory") : t("category")}
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
                        ? t("loadingCategories")
                        : categoriesError
                          ? t("loadCategoriesSignIn")
                          : t("noCategoryOption")}
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
                    {isCategoryFormOpen ? t("close") : `+ ${t("newCategory")}`}
                  </button>
                </div>

                {isCategoryFormOpen && (
                  <div className="category-create-panel">
                    <input
                      aria-label={t("categoryName")}
                      disabled={isCreatingCategory}
                      maxLength={50}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleCreateCategory();
                        }
                      }}
                      placeholder={t("categoryExample")}
                      type="text"
                      value={newCategoryName}
                    />
                    <button
                      disabled={isCreatingCategory}
                      onClick={() => void handleCreateCategory()}
                      type="button"
                    >
                      {isCreatingCategory ? t("creating") : t("createCategory")}
                    </button>
                    {categoryFormError && (
                      <small role="alert">{categoryFormError}</small>
                    )}
                  </div>
                )}
              </div>

              <div className="session-goal-field">
                <label htmlFor="session-goal">
                  {mode === "rest" ? t("nextSessionGoal") : t("sessionGoal")}
                </label>
                <textarea
                  disabled={goalLocked}
                  id="session-goal"
                  maxLength={160}
                  onChange={(event) => setSessionGoal(event.target.value)}
                  placeholder={t("goalExample")}
                  rows={3}
                  value={sessionGoal}
                />
                <div className="session-goal-meta">
                  <small>{sessionGoal.length}/160 · {t("optional")}</small>
                  <button
                    disabled={goalLocked || sessionGoal.length === 0}
                    onClick={() => setSessionGoal("")}
                    type="button"
                  >
                    {t("clear")}
                  </button>
                </div>
              </div>

              <DurationControl
                label={t("focusTimeLabel")}
                value={focusMinutes}
                disabled={configurationLocked}
                onChange={setFocusMinutes}
              />
              <DurationControl
                label={t("rest")}
                value={restMinutes}
                disabled={configurationLocked}
                onChange={setRestMinutes}
              />
              <p className="helper-text">{t("durationsHelp")}</p>
            </section>

            {mode === "rest" &&
              status === "running" &&
              activeSessionId !== null &&
              !reflectionSkipped && (
                <section className="reflection-card" aria-labelledby="reflection-title">
                  <div className="card-heading">
                    <div>
                      <p className="eyebrow">{t("quickCheckin")}</p>
                      <h2 id="reflection-title">{t("howWasFocus")}</h2>
                    </div>
                    <span className="status-badge">{t("optional")}</span>
                  </div>

                  <div className="reflection-quality" aria-label={t("focusQualityAria")}>
                    {[0, 1, 2, 3, 4, 5].map((quality) => (
                      <button
                        aria-label={`${quality} ${t("focusScore")}`}
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

                  <p className="reflection-question">{t("mainDistraction")}</p>
                  <div className="reflection-options">
                    {distractionOptions.map((option) => (
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
                      aria-label={t("otherDistractionAria")}
                      className="reflection-note-input"
                      maxLength={160}
                      onChange={(event) => setDistractionNote(event.target.value)}
                      placeholder={t("distractionNotePlaceholder")}
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
                      {reflectionStatus === "saving" ? t("saving") : t("saveCheckin")}
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
                      {t("skip")}
                    </button>
                  </div>

                  {reflectionStatus === "saved" && (
                    <small className="reflection-feedback">{t("checkinSaved")}</small>
                  )}
                  {reflectionStatus === "error" && (
                    <small className="reflection-feedback error">
                      {t("checkinSaveError")}
                    </small>
                  )}
                </section>
              )}

            <section className="progress-card" aria-labelledby="today-title">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">{t("todaySummary")}</p>
                  <h2 id="today-title">{t("yourDay")}</h2>
                </div>
                <strong>
                  {dailySummaryError
                    ? t("noSessionYet")
                    : today
                      ? `${today.session_count} ${
                          today.session_count === 1 ? t("session") : t("sessions")
                        }`
                      : t("loading")}
                </strong>
              </div>
              <div className="goal-row">
                <span>{t("dailyGoalOf")} {dailyGoalMinutes} {t("minuteShort")}</span>
                <strong>{dailyGoalProgress}%</strong>
              </div>
              <div
                className="goal-track"
                aria-label={`${dailyGoalProgress}% ${t("dailyGoalProgressAria")}`}
              >
                <span style={{ width: `${dailyGoalProgress}%` }} />
              </div>
              <p className="helper-text">
                {t("finishToTrack")}
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
