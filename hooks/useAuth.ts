// hooks/useAuth.ts
// Returns the current Supabase user and their profile.
// Safe to call from any Client Component.

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthState {
  user:    User | null
  profile: Profile | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true })

  // createBrowserClient is a singleton internally, but we memoize anyway
  // so the reference is stable across renders
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let cancelled = false

    const loadProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data as Profile | null
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return
      if (!user) { setState({ user: null, profile: null, loading: false }); return }
      const profile = await loadProfile(user.id)
      if (!cancelled) setState({ user, profile, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (cancelled) return
        if (!session?.user) { setState({ user: null, profile: null, loading: false }); return }
        const profile = await loadProfile(session.user.id)
        if (!cancelled) setState({ user: session.user, profile, loading: false })
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase])

  return state
}
