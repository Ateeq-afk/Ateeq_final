import axios from 'axios'
import { tokenManager, secureStorage } from '@/utils/secureStorage'

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Create axios instance for API calls
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CORS credentials
});

// Function to get selected branch from context
function getSelectedBranch(): string | null {
  try {
    const selectedBranch = sessionStorage.getItem('selectedBranch');
    return selectedBranch;
  } catch (err) {
    return null;
  }
}

// Add request interceptor to include auth token with validation
api.interceptors.request.use((config) => {
  try {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add selected branch header if available
    const selectedBranch = getSelectedBranch();
    if (selectedBranch) {
      config.headers['X-Selected-Branch'] = selectedBranch;
    }
    
    // Add CSRF token if available (will be implemented later)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  } catch (err) {
    console.error('Error in request interceptor:', err);
  }
  return config;
});


// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login if unauthorized
      tokenManager.removeToken();
      secureStorage.removeItem('userData');
      secureStorage.removeItem('selectedBranch');
      
      // Only redirect if not already on login/auth pages
      if (!window.location.pathname.includes('/auth') && 
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/signin')) {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// Export as default for other services
export default api;

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
