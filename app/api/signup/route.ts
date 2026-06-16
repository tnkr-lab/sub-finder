import { createAdminClient, createAnonClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { orgName, orgType, adminName, email, password } = await request.json()

  if (!orgName || !email || !password || !adminName) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const anonClient = createAnonClient()

  // signUp sends the verification email automatically
  const { data: authData, error: signUpError } = await anonClient.auth.signUp({
    email,
    password,
    options: {
      data: { name: adminName },
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

  const { data: org, error: orgError } = await adminClient
    .from('organisations')
    .insert({ name: orgName.trim().slice(0, 200), type: orgType })
    .select('id')
    .single()

  if (orgError || !org) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to create organisation' }, { status: 500 })
  }

  const { error: adminError } = await adminClient
    .from('org_admins')
    .insert({ org_id: org.id, user_id: userId, role: 'admin' })

  if (adminError) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to set up admin account' }, { status: 500 })
  }

  return NextResponse.json({ success: true, checkEmail: true })
}
