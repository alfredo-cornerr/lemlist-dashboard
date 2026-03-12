// Auth client that calls our API proxy instead of Supabase directly
// This bypasses DNS issues with supabase.co

export async function signUp(email: string, password: string) {
  const res = await fetch('/api/auth/signup', {
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
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  
  const data = await res.json()
  
  if (!res.ok) {
    throw new Error(data.error || "Login failed")
  }
  
  return { user: data.user, session: data.session }
}
