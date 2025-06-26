import axios from 'axios'

export async function login(orgId: string, username: string, password: string) {
  const { data } = await axios.post('/api/login', { orgId, username, password })
  return data.token as string
}

export async function signUp(options: {
  fullName: string
  desiredUsername: string
  password: string
  branchId: string
  role: string
}) {
  const { data } = await axios.post('/api/signup', options)
  return data
}

export async function fetchOrganizations() {
  const { data } = await axios.get('/api/organizations')
  return data
}

export async function createOrganization(name: string) {
  const { data } = await axios.post('/api/organizations', { name })
  return data
}

export async function fetchBranches(orgId?: string) {
  const { data } = await axios.get('/api/branches', { params: { orgId } })
  return data
}

export async function createBranch(orgId: string, name: string) {
  const { data } = await axios.post('/api/branches', { orgId, name })
  return data
}
