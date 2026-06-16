'use client'

interface SlotCardProps {
  absence: {
    id: string
    absent_staff_name: string
    date: string
    start_time: string
    end_time: string
    role?: string
    pay_rate: number
    status: string
    organisations?: { name: string }
    distance_km?: number | null
    viewers_count?: number
    created_at: string
  }
  showClaimButton?: boolean
  onClaim?: (absenceId: string) => void
}

export function SlotCard({ absence, showClaimButton, onClaim }: SlotCardProps) {
  const isToday = absence.date === new Date().toISOString().split('T')[0]
  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    claimed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  }

  const minutesAgo = Math.floor((Date.now() - new Date(absence.created_at).getTime()) / 60_000)
  const postedLabel = minutesAgo < 60
    ? `${minutesAgo}m ago`
    : `${Math.floor(minutesAgo / 60)}h ago`

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {absence.organisations?.name && (
            <p className="text-xs text-gray-500 mb-0.5 truncate">{absence.organisations.name}</p>
          )}
          <p className="font-semibold text-gray-900 truncate">{absence.role ?? absence.absent_staff_name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isToday && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">TODAY</span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[absence.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {absence.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-700 space-y-1">
        <p>{isToday ? 'Today' : new Date(absence.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} · {absence.start_time.slice(0, 5)}–{absence.end_time.slice(0, 5)}</p>
        <div className="flex items-center gap-3 text-gray-500">
          <span className="font-semibold text-gray-900">${absence.pay_rate}</span>
          {absence.distance_km != null && <span>{absence.distance_km}km away</span>}
          {absence.viewers_count ? <span>{absence.viewers_count} viewing</span> : null}
          <span>{postedLabel}</span>
        </div>
      </div>

      {showClaimButton && absence.status === 'open' && onClaim && (
        <button
          onClick={() => onClaim(absence.id)}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold min-h-[44px] hover:bg-blue-700 active:scale-95 transition-all"
        >
          Claim →
        </button>
      )}

      {absence.status === 'claimed' && (
        <div className="w-full bg-gray-100 text-gray-500 py-2.5 rounded-lg text-sm font-semibold text-center">
          ✓ FILLED
        </div>
      )}
    </div>
  )
}
