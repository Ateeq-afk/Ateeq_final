import React, { createContext, useContext, useEffect, useState } from 'react'
import { login as apiLogin } from '@/services/api'

interface UserPayload {
  userId: string
  orgId: number | null
  branchId: number | null
  role: string
}

interface AuthContextType {
  token: string | null
  user: UserPayload | null
  loading: boolean
  error: Error | null
  login: (orgId: string, username: string, password: string) => Promise<void>
  logout: () => void
  getCurrentUserBranch: () => { id: string } | null
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  loading: true,
  error: null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login: async (_o: string, _u: string, _p: string) => {},
  logout: () => {},
  getCurrentUserBranch: () => null
})

function decodeToken(token: string): UserPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload as UserPayload
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (stored) {
      setToken(stored)
      setUser(decodeToken(stored))
    }
    setLoading(false)
  }, [])

  async function login(orgId: string, username: string, password: string) {
    try {
      setLoading(true)
      const tok = await apiLogin(orgId, username, password)
      localStorage.setItem('token', tok)
      setToken(tok)
      setUser(decodeToken(tok))
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const getCurrentUserBranch = () => {
    if (user?.branchId) {
      return { id: String(user.branchId) }
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
