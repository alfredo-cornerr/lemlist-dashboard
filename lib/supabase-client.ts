"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug - log to console
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', supabaseUrl?.substring(0, 30) + '...')
  console.log('Supabase Key exists:', !!supabaseAnonKey)
}

// Browser client for client-side auth
export const supabaseBrowserClient = createClient(
  supabaseUrl,
  supabaseAnonKey
)

// Helper to get auth headers for API calls
export async function getAuthHeaders() {
  const { data: { session } } = await supabaseBrowserClient.auth.getSession()
  return {
    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
  }
}
