import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('org_admins')
    .select('id, org_id')
    .eq('user_id', user.id)
    .single()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { substitute_id } = await request.json()
  if (!substitute_id) return NextResponse.json({ error: 'substitute_id is required' }, { status: 400 })

  const supabaseAdmin = await createAdminClient()

  const { error } = await supabaseAdmin
    .from('pool_memberships')
    .update({ active: false })
    .eq('org_id', admin.org_id)
    .eq('substitute_id', substitute_id)

  if (error) return NextResponse.json({ error: 'Failed to remove substitute' }, { status: 500 })

  return NextResponse.json({ success: true })
}
