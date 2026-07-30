"use client";

import { formatMinutes } from "../../lib/formatters/time";
import { useDailySummary } from "../../lib/hooks/useDailySummary";

export function TodaySummaryCard() {
  const { summary, hasError } = useDailySummary();

  return (
    <article className="stat-card stat-card-featured">
      <span>Estudo hoje</span>
      <strong>{summary ? formatMinutes(summary.total_work_time) : "—"}</strong>
      <small>
        {hasError
          ? "API indisponível"
          : summary
            ? `${summary.session_count} ${
                summary.session_count === 1 ? "sessão concluída" : "sessões concluídas"
              } · dados reais`
            : "Buscando na sua API…"}
      </small>
    </article>
  );
}
