'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PoolSub {
  id: string
  name: string
  email: string
  phone: string | null
  qualifications: string[] | null
  membership_id: string
}

export function PoolClient({ initialPool }: { initialPool: PoolSub[] }) {
  const router = useRouter()
  const [pool, setPool] = useState<PoolSub[]>(initialPool)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setAddError('')
    setAddSuccess('')

    const res = await fetch('/api/pool/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    if (!res.ok) {
      setAddError(data.error ?? 'Failed to add substitute')
      setAdding(false)
      return
    }

    setAddSuccess(`${data.name} added to pool`)
    setEmail('')
    setAdding(false)
    router.refresh()
  }

  async function handleRemove(subId: string, name: string) {
    if (!confirm(`Remove ${name} from your pool?`)) return
    setRemoving(subId)

    const res = await fetch('/api/pool/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ substitute_id: subId }),
    })

    if (res.ok) {
      setPool(prev => prev.filter(s => s.id !== subId))
    }
    setRemoving(null)
  }

  return (
    <div className="space-y-6">
      {/* Add substitute */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Add substitute by email</h2>
        <p className="text-xs text-gray-500 mb-4">
          The substitute must have already created an account at{' '}
          <span className="font-medium">/substitute-signup</span>.
        </p>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="email"
            required
            placeholder="substitute@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {adding ? 'Adding…' : 'Add to pool'}
          </button>
        </form>
        {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
        {addSuccess && <p className="mt-2 text-sm text-green-600">{addSuccess}</p>}
      </div>

      {/* Pool list */}
      {pool.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
          No substitutes in your pool yet. Add your first substitute above.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Phone', 'Qualifications', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pool.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{sub.name}</td>
                  <td className="px-4 py-3 text-gray-600">{sub.email}</td>
                  <td className="px-4 py-3 text-gray-600">{sub.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(sub.qualifications ?? []).length > 0
                        ? sub.qualifications!.map(q => (
                            <span key={q} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {q.replace(/_/g, ' ')}
                            </span>
                          ))
                        : <span className="text-gray-400">—</span>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemove(sub.id, sub.name)}
                      disabled={removing === sub.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {removing === sub.id ? 'Removing…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
