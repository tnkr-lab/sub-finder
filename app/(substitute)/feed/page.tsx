import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedClient } from './client'
import { PushPermissionBanner } from '@/components/notifications/PushPermissionBanner'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sub } = await supabase
    .from('substitutes')
    .select('id, lat, lng')
    .eq('user_id', user.id)
    .single()

  if (!sub) redirect('/login')

  const { data: memberships } = await supabase
    .from('pool_memberships')
    .select('org_id')
    .eq('substitute_id', sub.id)
    .eq('active', true)

  const orgIds = (memberships ?? []).map(m => m.org_id)

  const { data: absences } = await supabase
    .from('absences')
    .select('*, organisations(name)')
    .in('org_id', orgIds.length ? orgIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Open Shifts</h1>
      </div>

      <PushPermissionBanner />

      <FeedClient
        initialAbsences={absences ?? []}
        orgIds={orgIds}
        substituteId={sub.id}
        substituteLat={sub.lat}
        substituteLng={sub.lng}
      />
    </div>
  )
}
