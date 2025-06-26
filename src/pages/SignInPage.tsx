import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function SignInPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({
      email: loginId,
      password
    })
    if (!error) {
      navigate('/dashboard')
    } else {
      console.error('Sign in failed', error)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit}>
        <Card className="w-80 space-y-4 p-8">
          <h2 className="text-center text-xl font-bold">Sign In</h2>
          <div className="space-y-2">
            <Label htmlFor="login">Username or Email</Label>
            <Input id="login" value={loginId} onChange={e => setLoginId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
          <p className="text-center text-sm">
            Don't have an account? <Link className="text-blue-600" to="/signup">Sign Up</Link>
          </p>
          <p className="text-center text-sm">
            New company? <Link className="text-blue-600" to="/new-organization">Create Organization</Link>
          </p>
        </Card>
      </form>
    </div>
  )
}
