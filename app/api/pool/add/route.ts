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

  const { email } = await request.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const supabaseAdmin = await createAdminClient()

  // Look up substitute by email
  const { data: sub } = await supabaseAdmin
    .from('substitutes')
    .select('id, name')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!sub) {
    return NextResponse.json(
      { error: 'No substitute account found with that email. Ask them to sign up first.' },
      { status: 404 }
    )
  }

  // Insert or re-activate pool membership
  const { error } = await supabaseAdmin
    .from('pool_memberships')
    .upsert(
      { org_id: admin.org_id, substitute_id: sub.id, active: true },
      { onConflict: 'org_id,substitute_id' }
    )

  if (error) return NextResponse.json({ error: 'Failed to add substitute to pool' }, { status: 500 })

  return NextResponse.json({ success: true, name: sub.name })
}
