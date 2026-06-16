'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/feed', label: 'Feed' },
  { href: '/my-shifts', label: 'My Shifts' },
  { href: '/profile', label: 'Profile' },
]

export default function SubstituteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 tracking-tight">SubFill</Link>
        <span className="text-xs text-indigo-600 font-semibold">Substitute</span>
      </header>
      <main className="flex-1 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] text-xs transition-colors ${
                active
                  ? 'text-indigo-600 font-medium'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {item.label}
              {active && (
                <span className="mt-1 w-1 h-1 bg-indigo-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
