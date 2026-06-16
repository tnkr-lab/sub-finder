import { createAnonClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const origin = new URL(request.url).origin
  const supabase = createAnonClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${origin}/api/auth/callback` },
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to resend. Try again shortly.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
