import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await request.json()

  const supabaseAdmin = await createAdminClient()
  const { error } = await supabaseAdmin
    .from('substitutes')
    .update({ push_subscription: subscription })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  return NextResponse.json({ success: true })
}
