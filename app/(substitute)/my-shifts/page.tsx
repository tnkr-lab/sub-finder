import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyShiftsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sub } = await supabase
    .from('substitutes')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!sub) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const { data: claimed } = await supabase
    .from('absences')
    .select('id, date, start_time, end_time, role, pay_rate, organisations(name)')
    .eq('claimed_by', sub.id)
    .order('date', { ascending: true })

  const upcoming = (claimed ?? []).filter(a => a.date >= today)
  const past = (claimed ?? []).filter(a => a.date < today)

  const monthlyEarnings = past
    .filter(a => new Date(a.date) >= monthStart)
    .reduce((sum, a) => {
      const [sh, sm] = a.start_time.split(':').map(Number)
      const [eh, em] = a.end_time.split(':').map(Number)
      const hours = (eh * 60 + em - sh * 60 - sm) / 60
      return sum + (a.pay_rate * hours)
    }, 0)

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">My Shifts</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-500 mb-0.5">Earnings this month</p>
        <p className="text-2xl font-bold text-blue-900">${monthlyEarnings.toFixed(2)}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming shifts.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="font-medium text-gray-900 text-sm">{(a.organisations as unknown as { name: string } | null)?.name}</p>
                <p className="text-sm text-gray-600">{formatDate(a.date)} · {a.start_time?.slice(0, 5)}–{a.end_time?.slice(0, 5)}</p>
                <p className="text-sm text-gray-900 font-medium mt-1">${a.pay_rate}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Past shifts</h2>
        {past.length === 0 ? (
          <p className="text-sm text-gray-500">No past shifts yet.</p>
        ) : (
          <div className="space-y-2">
            {past.slice().reverse().map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 opacity-75">
                <p className="font-medium text-gray-900 text-sm">{(a.organisations as unknown as { name: string } | null)?.name}</p>
                <p className="text-sm text-gray-600">{formatDate(a.date)} · {a.start_time?.slice(0, 5)}–{a.end_time?.slice(0, 5)}</p>
                <p className="text-sm text-gray-600">${a.pay_rate}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
