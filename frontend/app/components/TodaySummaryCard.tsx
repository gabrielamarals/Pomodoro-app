"use client";

import { formatMinutes } from "../../lib/formatters/time";
import { useDailySummary } from "../../lib/hooks/useDailySummary";
import { useI18n } from "../../lib/i18n/I18nProvider";

export function TodaySummaryCard() {
  const { summary, hasError } = useDailySummary();
  const { t } = useI18n();

  return (
    <article className="stat-card stat-card-featured">
      <span>{t("studyToday")}</span>
      <strong>{summary ? formatMinutes(summary.total_work_time) : "—"}</strong>
      <small>
        {hasError
          ? t("noSessionsSignIn")
          : summary
            ? `${summary.session_count} ${
                summary.session_count === 1 ? t("sessionCompleted") : t("sessionsCompleted")
              } · ${t("realData")}`
            : t("loadingProgress")}
      </small>
    </article>
  );
}
