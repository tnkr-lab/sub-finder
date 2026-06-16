interface FillRateStatsProps {
  pctFilled: number
  avgFillMinutes: number | null
  openCount: number
}

export function FillRateStats({ pctFilled, avgFillMinutes, openCount }: FillRateStatsProps) {
  const avgLabel = avgFillMinutes != null
    ? avgFillMinutes < 60
      ? `${avgFillMinutes}m`
      : `${Math.round(avgFillMinutes / 60)}h ${avgFillMinutes % 60}m`
    : '—'

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: 'Filled this week', value: `${Math.round(pctFilled)}%` },
        { label: 'Avg fill time', value: avgLabel },
        { label: 'Open now', value: String(openCount) },
      ].map(stat => (
        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-indigo-700">{stat.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
