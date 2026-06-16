'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function resend() {
    setStatus('sending')
    const res = await fetch('/api/auth/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      setStatus('sent')
      setTimeout(() => setStatus('idle'), 30_000)
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
          <p className="mt-2 text-sm text-gray-500">
            We sent a verification link to
          </p>
          {email && (
            <p className="mt-1 text-sm font-semibold text-gray-800">{email}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            Click the link in the email to activate your account. It may take a minute to arrive — check your spam folder if it doesn&apos;t show up.
          </p>

          {status === 'sent' && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-lg text-center">
              Email sent! Check your inbox.
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center">
              Failed to resend. Try again shortly.
            </p>
          )}

          <button
            onClick={resend}
            disabled={status === 'sending' || status === 'sent'}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Email sent' : 'Resend verification email'}
          </button>

          <Link
            href="/login"
            className="block text-sm text-center text-indigo-600 hover:underline font-medium"
          >
            Already verified? Sign in →
          </Link>
        </div>

        <p className="mt-6 text-xs text-center text-gray-400">
          Wrong email?{' '}
          <Link href="/signup" className="text-indigo-500 hover:underline">
            Start over
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  )
}
