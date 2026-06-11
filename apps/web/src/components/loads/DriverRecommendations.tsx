'use client';

interface RankedDriver {
  driver_id: string;
  rank: number;
  score: number;
  reason: string;
  deadhead_miles: number | null;
  eta_hours: number | null;
}

interface DriverRankings {
  ranked_drivers: RankedDriver[];
  recommendation_summary: string;
}

interface Props {
  details: Record<string, unknown> | null | undefined;
}

function scoreColor(score: number) {
  if (score >= 75) return '#16a34a'; // green
  if (score >= 45) return '#d97706'; // amber
  return '#dc2626'; // red
}

export function DriverRecommendations({ details }: Props) {
  if (!details) return null;

  const rankings = details['driver_rankings'] as DriverRankings | undefined;
  if (!rankings?.ranked_drivers?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-1">Driver Recommendations</h2>
      {rankings.recommendation_summary && (
        <p className="text-xs text-gray-500 mb-3">{rankings.recommendation_summary}</p>
      )}
      <ol className="space-y-2">
        {rankings.ranked_drivers.map((d) => (
          <li key={d.driver_id} className="flex items-start gap-3">
            {/* Rank badge */}
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: scoreColor(d.score) }}
            >
              {d.rank}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {/* Score bar */}
                <div className="h-1.5 w-16 rounded bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${d.score}%`,
                      backgroundColor: scoreColor(d.score),
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500">{d.score}/100</span>
              </div>
              <p className="text-xs text-gray-700 mt-0.5">{d.reason}</p>
              {(d.deadhead_miles != null || d.eta_hours != null) && (
                <p className="text-xs text-gray-400">
                  {d.deadhead_miles != null && `${d.deadhead_miles} mi deadhead`}
                  {d.deadhead_miles != null && d.eta_hours != null && ' · '}
                  {d.eta_hours != null && `~${d.eta_hours}h ETA`}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
