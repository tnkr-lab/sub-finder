'use client'

import { useState } from 'react'

interface ClaimButtonProps {
  absenceId: string
  substituteId: string
  orgName?: string
  date?: string
  onClaimed?: () => void
}

export function ClaimButton({ absenceId, substituteId, orgName, date, onClaimed }: ClaimButtonProps) {
  const [state, setState] = useState<'idle' | 'confirm' | 'claiming' | 'claimed' | 'filled'>('idle')
  const [message, setMessage] = useState('')

  async function doClaim() {
    setState('claiming')
    const res = await fetch('/api/claim-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ absence_id: absenceId, substitute_id: substituteId }),
    })

    if (!res.ok) {
      setState('idle')
      setMessage('Something went wrong. Try again.')
      return
    }

    const data = await res.json()
    if (data.success) {
      setState('claimed')
      onClaimed?.()
    } else {
      setState('filled')
      setMessage(data.message ?? 'Slot just filled by someone else')
    }
  }

  if (state === 'claimed') {
    return (
      <div className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-semibold text-center min-h-[44px]">
        ✓ Shift Claimed
      </div>
    )
  }

  if (state === 'filled') {
    return (
      <div className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-medium text-center min-h-[44px]">
        {message}
      </div>
    )
  }

  if (state === 'confirm') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-700 text-center">
          Confirm shift at <strong>{orgName}</strong>{date ? ` on ${date}` : ''}?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setState('idle')}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm min-h-[44px] hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={doClaim}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold min-h-[44px] hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {message && <p className="text-sm text-red-600 mb-2 text-center">{message}</p>}
      <button
        disabled={state === 'claiming'}
        onClick={() => setState('confirm')}
        className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold min-h-[44px] hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {state === 'claiming' ? 'Claiming…' : 'Claim →'}
      </button>
    </div>
  )
}
