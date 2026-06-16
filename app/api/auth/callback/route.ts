import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: adminRow } = await supabase
        .from('org_admins')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      return NextResponse.redirect(`${origin}${adminRow ? '/dashboard' : '/feed'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
