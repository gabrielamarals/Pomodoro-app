"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNavigation } from "../components/AppNavigation";
import { logout, updatePreferences, updateProfile, type Preferences } from "../../lib/services/auth";
import { useCurrentAccount } from "../../lib/hooks/useCurrentAccount";
import { useI18n } from "../../lib/i18n/I18nProvider";
import type { TranslationKey } from "../../lib/i18n/dictionaries";
import { applyTheme } from "../../lib/preferences/theme";

const THEMES = [
  { id: "natural", labelKey: "themeNatural", colors: ["#f4f1e9", "#18332e", "#e9654b"] },
  { id: "ember", labelKey: "themeEmber", colors: ["#0c0b0b", "#201a1a", "#e04437"] },
  { id: "ocean", labelKey: "themeOcean", colors: ["#edf3f6", "#142d40", "#3979ae"] },
] as const;

const PROFILE_LABELS: Record<string, TranslationKey> = {
  school: "goalSchool", exam: "goalExam", programming: "goalProgramming", work: "goalWork", reading: "goalReading", languages: "goalLanguages", other: "other",
  starting: "difficultyStarting", concentration: "difficultyConcentration", phone: "difficultyPhone", procrastination: "difficultyProcrastination", organization: "difficultyOrganization", tiredness: "difficultyTiredness", consistency: "difficultyConsistency",
};

export default function SettingsPage() {
  const router = useRouter();
  const { account, isLoading, refresh } = useCurrentAccount();
  const { setLocale, t } = useI18n();
  const [name, setName] = useState("");
  const [prefs, setPrefs] = useState<Partial<Preferences>>({});
  const [saved, setSaved] = useState<TranslationKey | null>(null);

  useEffect(() => {
    if (!account) return;
    setName(account.profile.display_name ?? "");
    setPrefs(account.preferences);
    applyTheme(account.preferences.theme);
    setLocale(account.preferences.locale);
  }, [account, setLocale]);

  async function saveProfile() {
    await updateProfile({ display_name: name.trim() || null });
    setSaved("profileSaved");
    refresh();
  }

  async function savePreferencePatch(patch: Partial<Preferences>) {
    const result = await updatePreferences(patch);
    setPrefs(result);
    setSaved("preferencesSaved");

    if (patch.theme !== undefined) applyTheme(result.theme);
    if (patch.locale !== undefined) setLocale(result.locale);
  }

  const profileLabel = (value: string | null, fallback: TranslationKey) => value ? t(PROFILE_LABELS[value] ?? "other") : t(fallback);

  if (isLoading) return <main className="auth-page"><p>{t("loading")}</p></main>;

  return (
    <main className="app-shell">
      <AppNavigation activePage="settings" />
      <section className="workspace settings-workspace">
        <header className="topbar settings-topbar">
          <div><p className="eyebrow">{t("preferences")}</p><h1>{t("settings")}.</h1></div>
          {saved && <span className="demo-badge">{t(saved)}</span>}
        </header>

        <section className="account-settings-card">
          <div><p className="eyebrow">{t("account")}</p><h2>{account?.user.email ?? t("noAccount")}</h2><p>{account ? t("accountReady") : t("signInToSync")}</p></div>
          {account ? <button className="secondary-action" type="button" onClick={async () => { await logout(); router.push("/login"); }}>{t("logout")}</button> : <button className="primary-action" type="button" onClick={() => router.push("/login")}>{t("login")}</button>}
        </section>

        {account && <>
          <section className="appearance-card settings-form-card">
            <div className="appearance-heading"><div><p className="eyebrow">{t("profile")}</p><h2>{t("profileQuestion")}</h2></div></div>
            <div className="settings-form-row"><input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("namePlaceholder")} /><button className="primary-action" type="button" onClick={saveProfile}>{t("save")}</button></div>
            <p className="data-note">{t("goalLabel")}: {profileLabel(account.profile.primary_goal, "notDefinedMasc")} · {t("difficultyLabel")}: {profileLabel(account.profile.main_difficulty, "notDefinedFem")}</p>
          </section>

          <section className="appearance-card settings-form-card">
            <div className="appearance-heading"><div><p className="eyebrow">Pomodoro</p><h2>{t("pomodoroBehavior")}</h2></div></div>
            <div className="settings-grid">
              <label>{t("focus")}<input type="number" min="1" max="120" value={prefs.focus_minutes ?? 25} onChange={(event) => setPrefs({ ...prefs, focus_minutes: Number(event.target.value) })} /></label>
              <label>{t("rest")}<input type="number" min="1" max="60" value={prefs.rest_minutes ?? 5} onChange={(event) => setPrefs({ ...prefs, rest_minutes: Number(event.target.value) })} /></label>
              <label>{t("longRest")}<input type="number" min="1" max="120" value={prefs.long_rest_minutes ?? 15} onChange={(event) => setPrefs({ ...prefs, long_rest_minutes: Number(event.target.value) })} /></label>
              <label>{t("sessionsBeforeLongRest")}<input type="number" min="1" max="12" value={prefs.sessions_before_long_rest ?? 4} onChange={(event) => setPrefs({ ...prefs, sessions_before_long_rest: Number(event.target.value) })} /></label>
            </div>
            <label className="checkbox-row"><input type="checkbox" checked={prefs.auto_start_rest ?? true} onChange={(event) => setPrefs({ ...prefs, auto_start_rest: event.target.checked })} /> {t("autoStartRest")}</label>
            <label className="checkbox-row"><input type="checkbox" checked={prefs.auto_start_focus ?? true} onChange={(event) => setPrefs({ ...prefs, auto_start_focus: event.target.checked })} /> {t("autoStartFocus")}</label>
            <label className="checkbox-row"><input type="checkbox" checked={prefs.sound_enabled ?? true} onChange={(event) => setPrefs({ ...prefs, sound_enabled: event.target.checked })} /> {t("transitionSound")}</label>
            <label className="checkbox-row"><input type="checkbox" checked={prefs.notifications_enabled ?? true} onChange={(event) => setPrefs({ ...prefs, notifications_enabled: event.target.checked })} /> {t("browserNotifications")}</label>
            <button className="primary-action" type="button" onClick={() => savePreferencePatch({
              focus_minutes: prefs.focus_minutes,
              rest_minutes: prefs.rest_minutes,
              long_rest_minutes: prefs.long_rest_minutes,
              sessions_before_long_rest: prefs.sessions_before_long_rest,
              auto_start_rest: prefs.auto_start_rest,
              auto_start_focus: prefs.auto_start_focus,
              sound_enabled: prefs.sound_enabled,
              notifications_enabled: prefs.notifications_enabled,
            })}>{t("savePreferences")}</button>
          </section>

          <section className="appearance-card">
            <div className="appearance-heading"><div><p className="eyebrow">{t("appearance")}</p><h2>{t("theme")}</h2></div></div>
            <div className="theme-options">{THEMES.map((theme) => <button key={theme.id} className={`theme-option ${prefs.theme === theme.id ? "selected" : ""}`} type="button" onClick={() => savePreferencePatch({ theme: theme.id })}><span className="theme-preview">{theme.colors.map((color) => <i key={color} style={{ background: color }} />)}</span><span className="theme-copy"><strong>{t(theme.labelKey)}</strong></span></button>)}</div>
          </section>

          <section className="appearance-card settings-form-card">
            <div className="appearance-heading"><div><p className="eyebrow">{t("language")}</p><h2>{t("languageTitle")}</h2></div></div>
            <select aria-label={t("languageTitle")} value={prefs.locale ?? "pt-BR"} onChange={(event) => savePreferencePatch({ locale: event.target.value as "pt-BR" | "en" })}><option value="pt-BR">{t("portuguese")}</option><option value="en">{t("english")}</option></select>
          </section>
        </>}
      </section>
    </main>
  );
}
