import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface UserPayload extends User {}

interface AuthContextType {
  token: string | null
  user: UserPayload | null
  loading: boolean
  error: Error | null
  login: (loginId: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getCurrentUserBranch: () => { id: string } | null
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  loading: true,
  error: null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login: async (_u: string, _p: string) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logout: async () => {},
  getCurrentUserBranch: () => null
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setToken(session?.access_token || null)
      setUser(session?.user || null)
    })

    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || null)
      setUser(data.session?.user || null)
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function login(loginId: string, password: string) {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginId,
        password
      })
      if (error) throw error
      setToken(data.session?.access_token || null)
      setUser(data.session?.user || null)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setToken(null)
    setUser(null)
  }

  const getCurrentUserBranch = () => {
    const branchId = user?.user_metadata?.branch_id
    if (branchId) {
      return { id: String(branchId) }
    }
    return null
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, error, login, logout, getCurrentUserBranch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
