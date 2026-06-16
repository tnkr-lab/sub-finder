import Link from 'next/link'

interface AuthNavProps {
  right?: {
    label: string
    href: string
  }
}

export function AuthNav({ right }: AuthNavProps) {
  return (
    <header className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-gray-900 text-lg tracking-tight hover:opacity-80 transition-opacity">
        SubFill
      </Link>
      {right && (
        <Link href={right.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          {right.label}
        </Link>
      )}
    </header>
  )
}
