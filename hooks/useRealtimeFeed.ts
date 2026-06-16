'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeFeed<T extends { id: string }>(orgIds: string[], initialAbsences: T[]) {
  const [absences, setAbsences] = useState<T[]>(initialAbsences)

  useEffect(() => {
    if (!orgIds.length) return

    const supabase = createClient()
    const channel = supabase
      .channel('absences-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'absences',
          filter: `org_id=in.(${orgIds.join(',')})`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAbsences(prev => [payload.new as T, ...prev])
          }
          if (payload.eventType === 'UPDATE') {
            setAbsences(prev =>
              prev.map(a => (a.id === payload.new.id ? (payload.new as T) : a))
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgIds])

  return { absences, setAbsences }
}
