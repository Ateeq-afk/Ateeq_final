// src/hooks/useArticleBookings.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Booking } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

// Simple UUID check
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isValidUUID = (id: string | null) => !!id && UUID_REGEX.test(id)

export function useArticleBookings(articleId: string, branchId: string | null = null) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { getCurrentUserBranch } = useAuth()
  const userBranch = getCurrentUserBranch()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    // 1. Validate articleId
    if (!isValidUUID(articleId)) {
      setError(new Error('Invalid article ID'))
      setBookings([])
      setLoading(false)
      return
    }

    // 2. Determine branch scope
    const useBranch =
      branchId && isValidUUID(branchId)
        ? branchId
        : userBranch?.id && isValidUUID(userBranch.id)
        ? userBranch.id
        : null

    try {
      // 3. Build the query string as a single-line literal
      const selectClause =
        '*,'
        + 'sender:customers!sender_id(id,name),'
        + 'receiver:customers!receiver_id(id,name),'
        + 'from_branch_details:branches!from_branch(id,name),'
        + 'to_branch_details:branches!to_branch(id,name)'

      let q = supabase
        .from('bookings')
        .select(selectClause)
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })

      // 4. Branch filter
      if (useBranch) {
        q = q.or(`from_branch.eq.${useBranch},to_branch.eq.${useBranch}`)
      }

      // 5. Execute
      const { data, error: sbError } = await q
      if (sbError) throw sbError

      setBookings((data as Booking[]) ?? [])
    } catch (err) {
      console.error('useArticleBookings error:', err)
      setError(err instanceof Error ? err : new Error('Failed to load bookings'))
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [articleId, branchId, userBranch])

  // 6. Fetch on mount / change
  useEffect(() => {
    load()
  }, [load])

  // 7. Return result
  return { bookings, loading, error, refresh: load }
}
