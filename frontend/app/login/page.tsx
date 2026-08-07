"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "../../lib/services/auth";
import { useI18n } from "../../lib/i18n/I18nProvider";

const API_BASE_URL = "http://localhost:8000";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await register({ email, password });
        setSuccess(t("accountCreated"));
        setMode("login");
        setPassword("");
      } else {
        await login({ email, password });
        router.push("/");
      }
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "";
      setError(message.includes("already registered") ? t("emailRegistered") : message.includes("Invalid email") ? t("invalidCredentials") : t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <a className="auth-brand" href="/">foco.</a>
        <p className="eyebrow">{t("studyRoutine")}</p>
        <h1 id="auth-title">{mode === "login" ? t("welcomeBack") : t("createAccount")}</h1>
        <p className="auth-description">
          {mode === "login" ? t("continueStudy") : t("createStudy")}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">{t("email")}</label>
          <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="auth-password">{t("password")}</label>
          <input id="auth-password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="primary-action auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? t("wait") : mode === "login" ? t("login") : t("create")}
          </button>
        </form>

        <div className="auth-divider"><span>{t("or")}</span></div>
        <a className="google-auth-button" href={`${API_BASE_URL}/auth/google/login`}>
          <span className="google-mark" aria-hidden="true">G</span>
          {t("continueGoogle")}
        </a>

        {error && <p className="auth-feedback error" role="alert">{error}</p>}
        {success && <p className="auth-feedback success" role="status">{success}</p>}
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setSuccess(null); }}>
          {mode === "login" ? t("noAccountYet") : t("alreadyHaveAccount")}
        </button>
      </section>
    </main>
  );
}
