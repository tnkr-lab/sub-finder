import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FillRateStats } from '@/components/dashboard/FillRateStats'
import { AdminDashboardClient } from './client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('org_admins')
    .select('id, org_id')
    .eq('user_id', user.id)
    .single()
  if (!admin) redirect('/login')

  // Fetch absences
  const { data: absences } = await supabase
    .from('absences')
    .select('*, substitutes(name)')
    .eq('org_id', admin.org_id)
    .order('created_at', { ascending: false })

  // Fetch claims for fill time
  const { data: claims } = await supabase
    .from('claims')
    .select('claimed_at, absences(created_at)')
    .in('absence_id', (absences ?? []).map(a => a.id))

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const thisWeek = (absences ?? []).filter(a => new Date(a.created_at) >= weekAgo)
  const filledThisWeek = thisWeek.filter(a => a.status === 'claimed').length
  const pctFilled = thisWeek.length ? (filledThisWeek / thisWeek.length) * 100 : 0
  const openCount = (absences ?? []).filter(a => a.status === 'open').length

  const fillTimes = (claims ?? []).map(c => {
    const claimedAt = new Date(c.claimed_at).getTime()
    const absence = c.absences as unknown as { created_at: string } | null
    const createdAt = new Date(absence?.created_at ?? 0).getTime()
    return (claimedAt - createdAt) / 60_000
  }).filter(Boolean)
  const avgFillMinutes = fillTimes.length
    ? Math.round(fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length)
    : null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <a href="/post-absence" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Post Absence
        </a>
      </div>

      <FillRateStats
        pctFilled={pctFilled}
        avgFillMinutes={avgFillMinutes}
        openCount={openCount}
      />

      <AdminDashboardClient
        initialAbsences={absences ?? []}
        orgId={admin.org_id}
      />
    </div>
  )
}
