"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "../../lib/services/auth";
import { useCurrentAccount } from "../../lib/hooks/useCurrentAccount";
import { useI18n } from "../../lib/i18n/I18nProvider";
import { applyTheme } from "../../lib/preferences/theme";

const steps = ["welcome", "profile", "focus", "settings", "done"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { account, isLoading } = useCurrentAccount();
  const { setLocale, t } = useI18n();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    display_name: "", age_range: "prefer_not_to_say", primary_goal: "programming",
    main_difficulty: "concentration", focus_range: "25_45", focus_minutes: 25,
    rest_minutes: 5, days_per_week: 5,
  });

  useEffect(() => {
    if (!isLoading && !account) router.replace("/login");
    if (!isLoading && account?.profile.onboarding_completed) router.replace("/");
  }, [account, isLoading, router]);

  useEffect(() => {
    if (!account) return;
    applyTheme(account.preferences.theme);
    setLocale(account.preferences.locale);
  }, [account, setLocale]);

  const update = (key: string, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));

  const finish = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      await completeOnboarding(form);
      setStep(4);
    } catch {
      setError(t("onboardingSaveError"));
    } finally {
      setBusy(false);
    }
  }, [form, t]);

  const advance = useCallback(() => {
    if (step === 3) {
      const focus = Number(form.focus_minutes);
      const rest = Number(form.rest_minutes);
      if (!Number.isInteger(focus) || focus < 1 || focus > 120 || !Number.isInteger(rest) || rest < 1 || rest > 60) {
        setError(t("onboardingValidation"));
        return;
      }
      void finish();
      return;
    }
    if (step < 3) {
      setError("");
      setStep((current) => current + 1);
    }
  }, [finish, form.focus_minutes, form.rest_minutes, step, t]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.isComposing || busy || step === 4) return;

      const target = event.target as HTMLElement | null;
      const isTextArea = target?.matches("textarea, [contenteditable='true']");
      const isSelect = target?.matches("select");
      const isSingleLineInput = target?.matches("input:not([type='checkbox']):not([type='radio'])");

      // Arrow keys must keep their native cursor/select behavior inside controls.
      // Enter submits a single-line onboarding field, while textareas/selects keep
      // their normal keyboard interaction.
      if (isTextArea || isSelect || (isSingleLineInput && event.key !== "Enter")) return;

      if (event.key === "ArrowLeft") {
        if (step > 0) {
          event.preventDefault();
          setStep((current) => current - 1);
        }
        return;
      }

      if (event.key === "Enter" || event.key === "ArrowRight") {
        event.preventDefault();
        advance();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [advance, busy, step]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    advance();
  }

  if (isLoading || !account) return <main className="auth-page"><p>{t("onboardingLoading")}</p></main>;

  return (
    <main className="auth-page onboarding-page">
      <form className="auth-card onboarding-card" onSubmit={handleSubmit}>
        <div className="onboarding-progress" aria-label={`${t("onboardingStep")} ${step + 1} ${t("of")} ${steps.length}`}>
          <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <p className="eyebrow">Foco · {step + 1} {t("of")} {steps.length}</p>

        {step === 0 && (
          <div className="onboarding-step">
            <h1>{t("onboardingWelcome")}</h1>
            <p>{t("onboardingIntro")}</p>
            <button className="primary-button onboarding-next" type="submit">{t("start")} <span aria-hidden="true">→</span></button>
            <small className="onboarding-hint">{t("keyboardHint")}</small>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step">
            <h1>{t("nameQuestion")}</h1>
            <label>{t("nameOrNickname")}<input autoFocus value={form.display_name} onChange={(event) => update("display_name", event.target.value)} placeholder={t("nameExample")} /></label>
            <label>{t("achievementQuestion")}<select value={form.primary_goal} onChange={(event) => update("primary_goal", event.target.value)}><option value="school">{t("goalSchool")}</option><option value="exam">{t("goalExam")}</option><option value="programming">{t("goalProgramming")}</option><option value="work">{t("goalWork")}</option><option value="reading">{t("goalReading")}</option><option value="languages">{t("goalLanguages")}</option><option value="other">{t("other")}</option></select></label>
            <button className="primary-button onboarding-next" type="submit">{t("continue")} <span aria-hidden="true">→</span></button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h1>{t("distractionQuestion")}</h1>
            <label>{t("mainDifficulty")}<select value={form.main_difficulty} onChange={(event) => update("main_difficulty", event.target.value)}><option value="starting">{t("difficultyStarting")}</option><option value="concentration">{t("difficultyConcentration")}</option><option value="phone">{t("difficultyPhone")}</option><option value="procrastination">{t("difficultyProcrastination")}</option><option value="organization">{t("difficultyOrganization")}</option><option value="tiredness">{t("difficultyTiredness")}</option><option value="consistency">{t("difficultyConsistency")}</option><option value="other">{t("other")}</option></select></label>
            <label>{t("focusRangeQuestion")}<select value={form.focus_range} onChange={(event) => update("focus_range", event.target.value)}><option value="under_15">{t("under15")}</option><option value="15_25">{t("range15_25")}</option><option value="25_45">{t("range25_45")}</option><option value="45_60">{t("range45_60")}</option><option value="over_60">{t("over60")}</option></select></label>
            <button className="primary-button onboarding-next" type="submit">{t("continue")} <span aria-hidden="true">→</span></button>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <h1>{t("configurePomodoro")}</h1>
            <div className="onboarding-settings-grid">
              <label><span>{t("initialFocus")}<small>{t("minutes")}</small></span><input type="number" min="1" max="120" value={form.focus_minutes} onChange={(event) => update("focus_minutes", Number(event.target.value))} /></label>
              <label><span>{t("rest")}<small>{t("minutes")}</small></span><input type="number" min="1" max="60" value={form.rest_minutes} onChange={(event) => update("rest_minutes", Number(event.target.value))} /></label>
              <label><span>{t("daysPerWeek")}<small>{t("desiredFrequency")}</small></span><select value={form.days_per_week} onChange={(event) => update("days_per_week", Number(event.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
            </div>
            <button className="primary-button onboarding-next" disabled={busy} type="submit">{busy ? t("saving") : t("finish")} <span aria-hidden="true">→</span></button>
            {error && <p className="form-error" role="alert">{error}</p>}
          </div>
        )}

        {step === 4 && (
          <div className="onboarding-step">
            <h1>{t("allReady")}{form.display_name ? `, ${form.display_name}` : ""}.</h1>
            <p>{t("spaceReady")}</p>
            <button className="primary-button onboarding-next" type="button" onClick={() => router.replace("/")}>{t("goToTimer")} <span aria-hidden="true">→</span></button>
          </div>
        )}

        {step > 0 && step < 4 && <button className="text-button" type="button" onClick={() => setStep((current) => current - 1)}>← {t("back")}</button>}
      </form>
    </main>
  );
}
