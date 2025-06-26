import { supabase } from '@/lib/supabaseClient'

export async function login(orgId: string, username: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: username,
    password
  })

  if (error || !data.session) throw error || new Error('Login failed')

  return data.session.access_token
}

export async function signUp(options: {
  fullName: string
  desiredUsername: string
  password: string
  branchId: string
}) {
  const { data, error } = await supabase.auth.signUp({
    email: options.desiredUsername,
    password: options.password
  })

  if (error || !data.user) throw error || new Error('Signup failed')

  const userId = data.user.id
  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    name: options.fullName,
    username: options.desiredUsername,
    branch_id: options.branchId
  })

  if (insertError) throw insertError

  return { userId, username: options.desiredUsername }
}

export async function fetchOrganizations() {
  const { data, error } = await supabase.from('organizations').select('*')
  if (error) throw error
  return data
}

export async function createOrganization(name: string) {
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name, display_name: name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchBranches(orgId?: string) {
  let query = supabase.from('branches').select('*')
  if (orgId) query = query.eq('organization_id', orgId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createBranch(orgId: string, name: string) {
  const { data, error } = await supabase
    .from('branches')
    .insert({ organization_id: orgId, name })
    .select()
    .single()
  if (error) throw error
  return data
}
