import { createAdminClient, createAnonClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sanitiseText } from '@/lib/validate'

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  if (!name?.trim() || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const anonClient = createAnonClient()

  // signUp sends the verification email automatically
  const { data: authData, error: signUpError } = await anonClient.auth.signUp({
    email,
    password,
    options: {
      data: { name: sanitiseText(name, 200) },
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  })

  if (signUpError || !authData.user) {
    if (signUpError?.message?.toLowerCase().includes('already registered')) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }

  const userId = authData.user.id
  const adminClient = await createAdminClient()

  const { error: subError } = await adminClient
    .from('substitutes')
    .insert({
      user_id: userId,
      name: sanitiseText(name, 200),
      email: email.trim().toLowerCase(),
    })

  if (subError) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to create substitute profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true, checkEmail: true })
}
