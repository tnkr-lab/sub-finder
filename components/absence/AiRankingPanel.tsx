'use client'

interface Ranking {
  substitute_id: string
  match_score: number
  recommendation: string
  flags: string[]
  warnings: string[]
  name?: string
}

interface AiRankingPanelProps {
  rankings: Ranking[]
  fallback?: boolean
}

export function AiRankingPanel({ rankings, fallback }: AiRankingPanelProps) {
  if (fallback) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        AI ranking unavailable — showing alphabetical list. You can still post the absence.
      </div>
    )
  }

  if (!rankings.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
        No substitutes in your pool yet. Add substitutes before posting.
      </div>
    )
  }

  function scoreColor(score: number) {
    if (score >= 80) return 'bg-green-100 text-green-700'
    if (score >= 60) return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">AI recommended matches</p>
      {rankings.map((r, i) => (
        <div key={r.substitute_id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">#{i + 1}</span>
              <span className="font-semibold text-gray-900 text-sm">{r.name ?? `Substitute ${i + 1}`}</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor(r.match_score)}`}>
              {r.match_score}%
            </span>
          </div>
          <p className="text-sm text-gray-600">{r.recommendation}</p>
          {r.flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {r.flags.map(f => (
                <span key={f} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✓ {f}</span>
              ))}
            </div>
          )}
          {r.warnings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {r.warnings.map(w => (
                <span key={w} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">⚠ {w}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
