'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QUALIFICATION_ALLOWLIST } from '@/lib/validate'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DISTANCES = [5, 10, 20, 50]

export default function ProfilePage() {
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [maxDistance, setMaxDistance] = useState(20)
  const [qualifications, setQualifications] = useState<string[]>([])
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: sub } = await supabase
        .from('substitutes')
        .select('availability, max_distance_km, qualifications, phone')
        .eq('user_id', user.id)
        .single()
      if (sub) {
        setAvailability(sub.availability ?? {})
        setMaxDistance(sub.max_distance_km ?? 20)
        setQualifications(sub.qualifications ?? [])
        setPhone(sub.phone ?? '')
      }
    })
  }, [])

  function toggleDay(day: string) {
    setAvailability(prev => ({ ...prev, [day]: !prev[day] }))
  }

  function toggleQual(q: string) {
    setQualifications(prev =>
      prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]
    )
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('substitutes')
      .update({ availability, max_distance_km: maxDistance, qualifications, phone: phone.trim() || null })
      .eq('user_id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Availability</p>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(day => (
              <button key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-full text-sm border min-h-[44px] transition-colors ${
                  availability[day] ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-500'
                }`}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Max travel distance</p>
          <div className="flex gap-2">
            {DISTANCES.map(d => (
              <button key={d}
                onClick={() => setMaxDistance(d)}
                className={`flex-1 py-2 rounded-lg text-sm border min-h-[44px] transition-colors ${
                  maxDistance === d ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-500'
                }`}>
                {d}km
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Qualifications</p>
          <div className="flex flex-wrap gap-2">
            {QUALIFICATION_ALLOWLIST.map(q => (
              <button key={q}
                onClick={() => toggleQual(q)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  qualifications.includes(q) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-500'
                }`}>
                {q.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone (for SMS notifications)</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+61400000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors min-h-[44px]">
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  )
}
