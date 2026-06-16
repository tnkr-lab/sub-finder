'use client'

import { useState } from 'react'
import { AiRankingPanel } from '@/components/absence/AiRankingPanel'

type Scope = 'top1' | 'top3' | 'all'

interface Ranking {
  substitute_id: string
  match_score: number
  recommendation: string
  flags: string[]
  warnings: string[]
}

export default function PostAbsencePage() {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    absent_staff_name: '',
    date: today,
    start_time: '08:30',
    end_time: '15:30',
    role: '',
    pay_rate: '',
    notes: '',
  })
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [fallback, setFallback] = useState(false)
  const [rankingLoaded, setRankingLoaded] = useState(false)
  const [ranking, setRanking] = useState(false)
  const [scope, setScope] = useState<Scope | ''>('')
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)
  const [error, setError] = useState('')

  function setField(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleRank(e: React.FormEvent) {
    e.preventDefault()
    setRanking(true)
    setError('')
    const res = await fetch('/api/rank-substitutes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ absence: form }),
    })
    const data = await res.json()
    setRankings(data.rankings ?? [])
    setFallback(!!data.fallback)
    setRankingLoaded(true)
    setRanking(false)
  }

  async function handlePost() {
    if (!scope) return
    setPosting(true)
    setError('')
    const res = await fetch('/api/post-absence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ai_rankings: rankings, scope }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to post absence')
      setPosting(false)
      return
    }
    setPosted(true)
  }

  if (posted) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="text-4xl">✅</div>
        <h2 className="text-xl font-semibold text-gray-900">Absence posted</h2>
        <p className="text-gray-600 text-sm">Substitutes have been notified. You&apos;ll be alerted when it&apos;s claimed.</p>
        <a href="/dashboard" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
          Back to dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Post Absence</h1>

      <form onSubmit={handleRank} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Absent staff name *</label>
          <input required type="text" value={form.absent_staff_name} onChange={setField('absent_staff_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input required type="date" min={today} value={form.date} onChange={setField('date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay rate ($/day) *</label>
            <input required type="number" min="1" step="0.01" value={form.pay_rate} onChange={setField('pay_rate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start time *</label>
            <input required type="time" value={form.start_time} onChange={setField('start_time')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End time *</label>
            <input required type="time" value={form.end_time} onChange={setField('end_time')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role / subject</label>
          <input type="text" value={form.role} onChange={setField('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400">({form.notes.length}/500)</span>
          </label>
          <textarea value={form.notes} onChange={setField('notes')} maxLength={500} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <button type="submit" disabled={ranking}
          className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
          {ranking ? 'AI is matching your pool…' : 'Match substitutes →'}
        </button>
      </form>

      {rankingLoaded && (
        <div className="space-y-4">
          <AiRankingPanel rankings={rankings} fallback={fallback} />

          {(rankings.length > 0 || fallback) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Who to notify?</p>
              <div className="grid grid-cols-3 gap-2">
                {(['top1', 'top3', 'all'] as Scope[]).map(s => (
                  <button key={s}
                    onClick={() => setScope(s)}
                    className={`py-2 rounded-lg text-sm border transition-colors ${scope === s ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                    {s === 'top1' ? 'Top match' : s === 'top3' ? 'Top 3' : 'Everyone'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handlePost}
            disabled={!scope || posting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {posting ? 'Posting…' : 'Post Absence'}
          </button>
        </div>
      )}
    </div>
  )
}
