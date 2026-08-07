import { formatMinutes } from "../../lib/formatters/time";
import type { DailySummary } from "../../lib/services/progress";
import { useI18n } from "../../lib/i18n/I18nProvider";

type WeeklyGoalCardProps = {
  dailyGoal: number;
  week: DailySummary[];
  isLoading?: boolean;
  hasError?: boolean;
  compact?: boolean;
};

export function WeeklyGoalCard({
  dailyGoal,
  week,
  isLoading = false,
  hasError = false,
  compact = false,
}: WeeklyGoalCardProps) {
  const { locale, t } = useI18n();
  const dayLabels = locale === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weeklyGoal = dailyGoal * 7;
  const weeklyTotal = week.reduce((total, day) => total + day.total_work_time, 0);
  const difference = weeklyTotal - weeklyGoal;
  const percentage = weeklyGoal > 0 ? Math.round((weeklyTotal / weeklyGoal) * 100) : 0;
  const progress = Math.min(100, Math.max(0, percentage));

  return (
    <section className={`weekly-goal-card ${compact ? "weekly-goal-card-compact" : ""}`} aria-labelledby="weekly-goal-title">
      <div className="weekly-goal-heading">
        <div>
          <p className="eyebrow">{t("weeklyGoal")}</p>
          <h2 id="weekly-goal-title">{t("weeklyPaceTitle")}</h2>
        </div>
        <strong>{isLoading ? "—" : `${percentage}%`}</strong>
      </div>

      {hasError ? (
        <p className="weekly-goal-message">{t("noWeeklyData")}</p>
      ) : (
        <>
          <div className="weekly-goal-track" aria-label={`${progress}% ${t("weeklyGoalProgressAria")}`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="weekly-goal-summary">
            <p>
              {isLoading
                ? t("loadingYourWeek")
                : difference >= 0
                  ? `${formatMinutes(difference)} ${t("aboveWeeklyGoal")}.`
                  : `${formatMinutes(Math.abs(difference))} ${t("belowWeeklyGoal")}.`}
            </p>
            <span>{formatMinutes(weeklyTotal)} / {formatMinutes(weeklyGoal)}</span>
          </div>
          {!compact && (
            <div className="goal-day-bars" aria-label={t("dailyMinutesGoalAria")}>
              {week.map((day) => {
                const date = new Date(`${day.date}T12:00:00`);
                const height = day.total_work_time === 0
                  ? 0
                  : Math.min(100, Math.max(4, (day.total_work_time / dailyGoal) * 100));
                return (
                  <div className="goal-day-bar" key={day.date}>
                    <span>{day.total_work_time || "—"}</span>
                    <div className="goal-day-track"><i style={{ height: `${height}%` }} /></div>
                    <small>{dayLabels[date.getDay()]}</small>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
