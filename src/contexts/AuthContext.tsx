import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { signIn, signOut } from '@/services/auth'

interface AuthUser {
  id: string
  email: string
  name?: string | null
}

interface UserRole {
  role: string
  branchId: string | null
}

interface AuthContextType {
  user: AuthUser | null
  role: UserRole | null
  loading: boolean
  error: Error | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getCurrentUserBranch: () => { id: string } | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  error: null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login: async (_e: string, _p: string) => {},
  logout: async () => {},
  getCurrentUserBranch: () => null
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    async function loadUser() {
      if (!session?.user) {
        setUser(null)
        setRole(null)
        setLoading(false)
        return
      }
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('name, role, branch_id')
        .eq('id', session.user.id)
        .single()

      if (fetchError) {
        setError(fetchError)
        setUser({ id: session.user.id, email: session.user.email ?? '' })
        setRole(null)
      } else {
        setUser({ id: session.user.id, email: session.user.email ?? '', name: data?.name })
        setRole({ role: data?.role ?? 'staff', branchId: data?.branch_id ?? null })
      }
      setLoading(false)
    }
    loadUser()
  }, [session])

  async function login(email: string, password: string) {
    try {
      setLoading(true)
      await signIn(email, password)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await signOut()
    setSession(null)
    setUser(null)
    setRole(null)
  }

  const getCurrentUserBranch = () => {
    if (role?.branchId) {
      return { id: role.branchId }
    }
    return null
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, error, login, logout, getCurrentUserBranch }}>
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
