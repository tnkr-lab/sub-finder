'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthNav } from '@/components/ui/AuthNav'
import { PasswordInput } from '@/components/ui/PasswordInput'

export default function SubstituteSignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/substitute-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Signup failed. Please try again.')
      setLoading(false)
      return
    }

    router.push(`/check-email?email=${encodeURIComponent(form.email)}`)
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <AuthNav right={{ label: 'Have an account? Sign in', href: '/login' }} />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">Join as substitute</p>
          <p className="text-sm text-gray-500 mt-1">Create your SubFill account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input id="name" type="text" required value={form.name} onChange={set('name')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" type="email" required value={form.email} onChange={set('email')} className={inputClass} />
            </div>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={set('password')}
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 pt-4 border-t border-gray-100 text-sm text-center text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
