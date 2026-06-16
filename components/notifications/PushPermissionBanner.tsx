'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushPermissionBanner() {
  const { permission, isSupported, subscribe } = usePushNotifications()

  if (!isSupported) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        Notifications are not supported on this browser. Open shifts will appear here automatically.
      </div>
    )
  }

  if (permission !== 'default') return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-blue-900">Enable shift notifications</p>
        <p className="text-xs text-blue-600 mt-0.5">Get alerted the moment a new shift is posted</p>
      </div>
      <button
        onClick={subscribe}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-blue-700 min-h-[44px]"
      >
        Enable
      </button>
    </div>
  )
}
