'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthNav } from '@/components/ui/AuthNav'
import { PasswordInput } from '@/components/ui/PasswordInput'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setUnverified(false)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      if (authError.message.toLowerCase().includes('email not confirmed')) {
        setUnverified(true)
      } else {
        setError('Invalid email or password')
      }
      setLoading(false)
      return
    }

    const { data: adminRow } = await supabase
      .from('org_admins')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single()

    router.push(adminRow ? '/dashboard' : '/feed')
    router.refresh()
  }

  async function resendVerification() {
    setResendStatus('sending')
    const res = await fetch('/api/auth/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setResendStatus(res.ok ? 'sent' : 'idle')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <AuthNav right={{ label: 'New here? Get started →', href: '/signup' }} />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">Sign in</p>
          <p className="text-sm text-gray-500 mt-1">Welcome back to SubFill</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {unverified && (
              <div className="text-sm bg-amber-50 border border-amber-100 px-3 py-3 rounded-lg space-y-2">
                <p className="text-amber-800 font-medium">Please verify your email first.</p>
                <p className="text-amber-700">Check your inbox for the verification link.</p>
                {resendStatus === 'sent' ? (
                  <p className="text-green-700 font-medium">Email resent! Check your inbox.</p>
                ) : (
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={resendStatus === 'sending'}
                    className="text-indigo-600 hover:underline font-medium disabled:opacity-50"
                  >
                    {resendStatus === 'sending' ? 'Sending…' : 'Resend verification email →'}
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-sm text-center text-gray-500">
              Admin?{' '}
              <Link href="/signup" className="text-indigo-600 hover:underline font-medium">
                Create organisation
              </Link>
            </p>
            <p className="text-sm text-center text-gray-500">
              Joining as a substitute?{' '}
              <Link href="/substitute-signup" className="text-indigo-600 hover:underline font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
