import { supabase } from '@/lib/supabaseClient'

export async function signIn(loginId: string, password: string) {
  let email = loginId
  if (!loginId.includes('@')) {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('username', loginId)
      .single()

    if (error || !data) throw error || new Error('User not found')
    email = data.email
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(options: {
  email: string
  username: string
  password: string
  name: string
  branchId: string
  role?: string
}) {
  const { data, error } = await supabase.auth.signUp({
    email: options.email,
    password: options.password
  })
  if (error) throw error
  const user = data.user
  if (user) {
    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      name: options.name,
      email: options.email,
      username: options.username,
      branch_id: options.branchId,
      role: options.role ?? 'staff'
    })
    if (insertError) throw insertError
  }
  return user
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
