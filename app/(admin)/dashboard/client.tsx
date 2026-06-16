'use client'

import { useRealtimeFeed } from '@/hooks/useRealtimeFeed'

interface Absence {
  id: string
  absent_staff_name: string
  date: string
  start_time: string
  end_time: string
  role?: string
  status: string
  pay_rate: number
  created_at: string
  claimed_at?: string
  substitutes?: { name: string } | null
}

export function AdminDashboardClient({
  initialAbsences,
  orgId,
}: {
  initialAbsences: Absence[]
  orgId: string
}) {
  const { absences } = useRealtimeFeed([orgId], initialAbsences)

  const statusBadge: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    claimed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  }

  async function renotify(absenceId: string) {
    await fetch('/api/notify-pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ absence_id: absenceId, scope: 'all' }),
    })
  }

  if (!absences.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
        No absences posted yet. Post your first absence to get started.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Date', 'Time', 'Role', 'Status', 'Claimed by', 'Fill time', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {absences.map(a => {
            const fillMs = a.claimed_at
              ? new Date(a.claimed_at).getTime() - new Date(a.created_at).getTime()
              : null
            const fillLabel = fillMs
              ? fillMs < 3_600_000
                ? `${Math.round(fillMs / 60_000)}m`
                : `${Math.round(fillMs / 3_600_000)}h`
              : '—'

            return (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{a.date}</td>
                <td className="px-4 py-3 text-gray-600">{a.start_time?.slice(0, 5)}–{a.end_time?.slice(0, 5)}</td>
                <td className="px-4 py-3 text-gray-900">{a.role ?? a.absent_staff_name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {a.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{a.substitutes?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{fillLabel}</td>
                <td className="px-4 py-3">
                  {a.status === 'open' && (
                    <button
                      onClick={() => renotify(a.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Re-notify
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
