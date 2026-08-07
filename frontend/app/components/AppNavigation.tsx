"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentAccount } from "../../lib/hooks/useCurrentAccount";
import { useI18n } from "../../lib/i18n/I18nProvider";
import { applyTheme } from "../../lib/preferences/theme";

type AppNavigationProps = {
  activePage: "timer" | "progress" | "categories" | "history" | "settings";
};

export function AppNavigation({ activePage }: AppNavigationProps) {
  const { account, isLoading } = useCurrentAccount();
  const router = useRouter();
  const pathname = usePathname();
  const initials = account?.user.email.slice(0, 1).toUpperCase() ?? "?";
  const { setLocale, t } = useI18n();

  useEffect(() => {
    if (!isLoading && account && !account.profile.onboarding_completed && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [account, isLoading, pathname, router]);

  useEffect(() => {
    if (!account) return;
    applyTheme(account.preferences.theme);
    setLocale(account.preferences.locale);
  }, [account, setLocale]);

  return (
    <aside className="sidebar" aria-label={t("mainNavigation")}>
      <Link className="brand" href="/" aria-label="Foco">
        <span className={`brand-mark ${account ? "brand-avatar" : "brand-guest"}`}>{isLoading ? "·" : account ? initials : "?"}</span>
        <span>foco.</span>
      </Link>
      <nav className="main-nav">
        <Link className={`nav-item ${activePage === "timer" ? "active" : ""}`} href="/">⏱️ {t("timer")}</Link>
        <Link className={`nav-item ${activePage === "progress" ? "active" : ""}`} href="/progress">◫ {t("progress")}</Link>
        <Link className={`nav-item ${activePage === "history" ? "active" : ""}`} href="/history">↪ {t("history")}</Link>
        <Link className={`nav-item ${activePage === "categories" ? "active" : ""}`} href="/categories">⌂ {t("categories")}</Link>
        <Link className={`nav-item ${activePage === "settings" ? "active" : ""}`} href="/settings">⚙️ {t("settings")}</Link>
      </nav>
      <Link className="account-shortcut" href={account ? "/settings" : "/login"}>
        <span>{account ? account.user.email : t("signInOrCreate")}</span>
        <small>{account ? t("myAccount") : t("quickAccess")}</small>
      </Link>
      <p className="sidebar-note">{t("oneStepAtATime")}</p>
    </aside>
  );
}
