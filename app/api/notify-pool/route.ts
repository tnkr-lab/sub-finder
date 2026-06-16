import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendPush } from '@/lib/push'
import { sendSms } from '@/lib/sms'
import { checkRateLimit } from '@/lib/rate-limit'
import type { PushSubscription } from 'web-push'

interface PoolSub {
  id: string
  name: string
  phone: string | null
  push_subscription: PushSubscription | null
}

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

  const { absence_id, scope } = await request.json()

  if (!checkRateLimit(`notify:${absence_id}`, 5 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests — wait 5 minutes before re-notifying' }, { status: 429 })
  }

  const supabaseAdmin = await createAdminClient()

  const { data: absence } = await supabaseAdmin
    .from('absences')
    .select('*, organisations(name)')
    .eq('id', absence_id)
    .single()

  if (!absence) return NextResponse.json({ error: 'Absence not found' }, { status: 404 })

  const { data: memberships } = await supabaseAdmin
    .from('pool_memberships')
    .select('substitutes(id, name, phone, push_subscription)')
    .eq('org_id', admin.org_id)
    .eq('active', true)

  if (!memberships) return NextResponse.json({ sent: 0, failed: 0 })

  let pool = memberships.map(m => m.substitutes as unknown as PoolSub)

  if (scope === 'top1' && absence.ai_rankings?.length) {
    const topId = (absence.ai_rankings[0] as { substitute_id: string })?.substitute_id
    pool = pool.filter(s => s.id === topId)
  } else if (scope === 'top3' && absence.ai_rankings?.length) {
    const topIds = (absence.ai_rankings as { substitute_id: string }[]).slice(0, 3).map(r => r.substitute_id)
    pool = pool.filter(s => topIds.includes(s.id))
  }

  const orgName = (absence.organisations as { name: string } | null)?.name ?? 'Your organisation'
  const dateStr = absence.date === new Date().toISOString().split('T')[0] ? 'TODAY' : absence.date
  const smsBody = `New shift at ${orgName} — ${dateStr} ${absence.start_time}–${absence.end_time} · $${absence.pay_rate}.\nClaim now: https://subfill.app/feed`
  const pushPayload = {
    title: `New shift — ${orgName}`,
    body: `${dateStr} · ${absence.start_time}–${absence.end_time} · $${absence.pay_rate}`,
    url: `/feed?absence=${absence_id}`,
  }

  let sent = 0
  let failed = 0

  await Promise.allSettled(
    pool.map(async sub => {
      const notifRows: object[] = []

      await Promise.allSettled([
        sub.push_subscription
          ? sendPush(sub.push_subscription, pushPayload)
              .then(() => notifRows.push({ substitute_id: sub.id, absence_id, type: 'new_slot' }))
              .catch(() => notifRows.push({ substitute_id: sub.id, absence_id, type: 'new_slot', sent_at: null }))
          : Promise.resolve(),
        sub.phone
          ? sendSms(sub.phone, smsBody)
              .then(() => notifRows.push({ substitute_id: sub.id, absence_id, type: 'new_slot' }))
              .catch(() => {})
          : Promise.resolve(),
      ])

      if (notifRows.length) {
        await supabaseAdmin.from('notifications').insert(notifRows)
        sent++
      } else {
        failed++
      }
    })
  )

  return NextResponse.json({ sent, failed })
}
