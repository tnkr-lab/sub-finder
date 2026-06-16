import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { validateDate, validatePayRate, sanitiseText, validateTime } from '@/lib/validate'

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

  const body = await request.json()
  const { absent_staff_name, date, start_time, end_time, role, pay_rate, notes, ai_rankings, scope } = body

  // Validate
  if (!absent_staff_name?.trim()) return NextResponse.json({ error: 'Staff name is required' }, { status: 400 })
  if (!validateDate(date)) return NextResponse.json({ error: 'Date must be today or in the future' }, { status: 400 })
  if (!validateTime(start_time) || !validateTime(end_time)) return NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
  if (end_time <= start_time) return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })

  let parsedPayRate: number
  try {
    parsedPayRate = validatePayRate(pay_rate)
  } catch {
    return NextResponse.json({ error: 'Pay rate must be a positive number' }, { status: 400 })
  }

  const supabaseAdmin = await createAdminClient()
  const { data: newAbsence, error: insertError } = await supabaseAdmin
    .from('absences')
    .insert({
      org_id: admin.org_id,
      posted_by: admin.id,
      absent_staff_name: sanitiseText(absent_staff_name, 200),
      date,
      start_time,
      end_time,
      role: role ? sanitiseText(role, 200) : null,
      pay_rate: parsedPayRate,
      notes: notes ? sanitiseText(notes, 500) : null,
      status: 'open',
      ai_rankings: ai_rankings ?? null,
    })
    .select('id')
    .single()

  if (insertError || !newAbsence) {
    return NextResponse.json({ error: 'Failed to post absence' }, { status: 500 })
  }

  // Notify pool (fire and forget — failure doesn't block response)
  fetch(`${new URL(request.url).origin}/api/notify-pool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ absence_id: newAbsence.id, scope: scope ?? 'all' }),
  }).catch(() => {})

  return NextResponse.json({ absence_id: newAbsence.id, status: 'open' })
}
