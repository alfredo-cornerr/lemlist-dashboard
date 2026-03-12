// Auth client that calls our API proxy
const API_URL = '/api/auth'

export async function signUp(email: string, password: string) {
  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  
  const data = await res.json()
  
  if (!res.ok) {
    throw new Error(data.error || "Signup failed")
  }
  
  return { user: data.user, session: data.session }
}

export async function signIn(email: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  
  const data = await res.json()
  
  if (!res.ok) {
    throw new Error(data.error || "Login failed")
  }
  
  // Save session to localStorage
  if (data.session?.access_token) {
    localStorage.setItem('access_token', data.session.access_token)
    localStorage.setItem('refresh_token', data.session.refresh_token)
  }
  
  return { user: data.user, session: data.session }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}
