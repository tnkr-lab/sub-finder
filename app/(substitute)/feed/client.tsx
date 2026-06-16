'use client'

import { useState } from 'react'
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed'
import { SlotCard } from '@/components/absence/SlotCard'
import { ClaimButton } from '@/components/substitute/ClaimButton'
import { haversineKm } from '@/lib/distance'

interface Absence {
  id: string
  absent_staff_name: string
  date: string
  start_time: string
  end_time: string
  role?: string
  pay_rate: number
  status: string
  created_at: string
  viewers_count?: number
  organisations?: { name: string }
  [key: string]: unknown
}

interface FeedClientProps {
  initialAbsences: Absence[]
  orgIds: string[]
  substituteId: string
  substituteLat: number | null
  substituteLng: number | null
}

export function FeedClient({ initialAbsences, orgIds, substituteId, substituteLat, substituteLng }: FeedClientProps) {
  const { absences } = useRealtimeFeed(orgIds, initialAbsences)
  const [filter, setFilter] = useState<'all' | 'today'>('all')
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const filtered = (absences as unknown as Absence[]).filter(a =>
    filter === 'today' ? a.date === today : true
  )

  function distanceFor(a: Absence) {
    if (!substituteLat || !substituteLng) return null
    const orgLat = (a as Record<string, number>).org_lat
    const orgLng = (a as Record<string, number>).org_lng
    if (!orgLat || !orgLng) return null
    return Math.round(haversineKm(substituteLat, substituteLng, orgLat, orgLng) * 10) / 10
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['all', 'today'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filter === f ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
            {f === 'all' ? 'All shifts' : 'Today only'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-sm">
          No open shifts right now. You&apos;ll be notified when one comes in.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(a => (
          <div key={a.id} className="space-y-2">
            <SlotCard
              absence={{ ...a, distance_km: distanceFor(a) }}
              showClaimButton={false}
            />
            {a.status === 'open' && (
              claimingId === a.id ? (
                <ClaimButton
                  absenceId={a.id}
                  substituteId={substituteId}
                  orgName={a.organisations?.name}
                  date={a.date}
                  onClaimed={() => setClaimingId(null)}
                />
              ) : (
                <button
                  onClick={() => setClaimingId(a.id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold min-h-[44px] hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Claim →
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
