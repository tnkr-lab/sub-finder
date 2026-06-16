import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PoolClient } from './client'

interface PoolSub {
  id: string
  name: string
  email: string
  phone: string | null
  qualifications: string[] | null
  membership_id: string
}

export default async function PoolPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('org_admins')
    .select('id, org_id')
    .eq('user_id', user.id)
    .single()
  if (!admin) redirect('/login')

  const { data: memberships } = await supabase
    .from('pool_memberships')
    .select('id, substitutes(id, name, email, phone, qualifications)')
    .eq('org_id', admin.org_id)
    .eq('active', true)
    .order('added_at', { ascending: true })

  const pool: PoolSub[] = (memberships ?? []).map(m => {
    const sub = m.substitutes as unknown as { id: string; name: string; email: string; phone: string | null; qualifications: string[] | null }
    return { ...sub, membership_id: m.id }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Substitute Pool</h1>
        <span className="text-sm text-gray-500">{pool.length} substitute{pool.length !== 1 ? 's' : ''}</span>
      </div>

      <PoolClient initialPool={pool} />
    </div>
  )
}
