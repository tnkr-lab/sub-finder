import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: admin } = await supabase
      .from('org_admins')
      .select('id')
      .eq('user_id', user.id)
      .single()
    redirect(admin ? '/dashboard' : '/feed')
  }

  return (
    <div className="min-h-screen bg-white font-[var(--font-geist-sans)]">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-lg tracking-tight">SubFill</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse inline-block" />
          AI-powered substitute matching
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-4 tracking-tight">
          Fill any absence<br />in under 3 minutes.
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          Post an absence, let AI rank your substitute pool, and watch it get filled — before the school day starts.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="text-gray-700 px-6 py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x divide-gray-200">
          {[
            { value: '< 3 min', label: 'Avg fill time' },
            { value: 'AI-ranked', label: 'Substitute matching' },
            { value: 'Push + SMS', label: 'Notification channels' },
            { value: 'RLS-isolated', label: 'Per-org data security' },
          ].map(s => (
            <div key={s.label} className="text-center px-4">
              <p className="text-base font-bold text-indigo-700">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">How it works</h2>
        <p className="text-sm text-gray-500 text-center mb-12">Three steps from absent to filled.</p>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {[
            {
              step: '1',
              title: 'Admin posts an absence',
              body: 'Fill in the role, date, and pay rate. Done in under 30 seconds.',
            },
            {
              step: '2',
              title: 'AI ranks your pool',
              body: 'Claude scores every substitute on availability, distance, and subject match — in 2 seconds.',
            },
            {
              step: '3',
              title: 'Substitute claims it',
              body: 'Push and SMS fire immediately. Sub taps Claim. The slot is filled.',
            },
          ].map((item, i) => (
            <div key={item.step} className="flex flex-col items-center text-center relative">
              {i < 2 && (
                <div className="hidden md:block absolute top-5 left-[calc(50%+28px)] right-[-50%] h-px bg-indigo-100" />
              )}
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm mb-4 relative z-10">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For admins / for subs */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 rounded-2xl p-8">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">For admins</p>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Run your pool like a pro</h3>
          <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
            {[
              'Post an absence in 30 seconds',
              'See AI-ranked substitutes instantly',
              'Real-time fill status dashboard',
              'Fill rate and timing analytics',
            ].map(f => (
              <li key={f} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Create organisation →
          </Link>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">For substitutes</p>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Be first in line</h3>
          <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
            {[
              'Get push + SMS the moment a shift opens',
              'Claim in one tap on your phone',
              'Track all your upcoming shifts',
              'Set your availability and subjects',
            ].map(f => (
              <li key={f} className="flex items-start gap-2">
                <span className="text-gray-400 font-bold mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/substitute-signup"
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Join as substitute →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <p className="text-center text-xs text-gray-400">
          SubFill · Built with Next.js, Supabase & Claude
        </p>
      </footer>
    </div>
  )
}
