import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } from "./supabase-config"

const supabaseUrl = SUPABASE_URL
const supabaseAnonKey = SUPABASE_ANON_KEY
const supabaseServiceKey = SUPABASE_SERVICE_KEY

// Create a server-side Supabase client with cookie-based auth
export async function createServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Handle cases where cookies can't be set
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch {
          // Handle cases where cookies can't be removed
        }
      },
    },
  })
}

// Admin client for database operations - use fetch directly to avoid issues
export const supabaseAdmin = {
  from: (table: string) => ({
    select: async (columns: string) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      })
      return { data: await res.json(), error: null }
    },
    rpc: async (fn: string, params: any) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })
      return { data: await res.json(), error: null }
    },
  })
}

// Get current user from server
export async function getCurrentUser() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error("getUser error:", error)
      return null
    }
    
    return user
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}
