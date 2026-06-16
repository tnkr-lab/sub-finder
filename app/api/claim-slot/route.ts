import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { absence_id, substitute_id } = await request.json()

  // Verify substitute_id belongs to authenticated user
  const { data: sub } = await supabase
    .from('substitutes')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!sub || sub.id !== substitute_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!checkRateLimit(`claim:${sub.id}`, 5_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabaseAdmin = await createAdminClient()

  // Atomic insert — UNIQUE constraint on absence_id prevents double-claim
  const { error: claimError } = await supabaseAdmin
    .from('claims')
    .insert({ absence_id, substitute_id: sub.id })
    // claimed_at uses DB DEFAULT now() — no client timestamp

  // Log attempt regardless of outcome
  await supabaseAdmin.from('notifications').insert({
    substitute_id: sub.id,
    absence_id,
    type: 'claim_attempt',
    result: claimError ? (claimError.code === '23505' ? 'race_lost' : 'error') : 'success',
  })

  if (claimError?.code === '23505') {
    return NextResponse.json({ success: false, message: 'Slot just filled by someone else' })
  }
  if (claimError) {
    return NextResponse.json({ error: 'Claim failed' }, { status: 500 })
  }

  // Update absence status — defence-in-depth; UNIQUE constraint is the real guard
  await supabaseAdmin
    .from('absences')
    .update({ status: 'claimed', claimed_by: sub.id })
    .eq('id', absence_id)
    .eq('status', 'open')

  return NextResponse.json({ success: true })
}
