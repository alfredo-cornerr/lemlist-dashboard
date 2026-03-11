"use client"

import { createBrowserClient } from "@supabase/ssr"

// Get env vars safely
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined")
  return url
}

const getSupabaseKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined")
  return key
}

// Debug
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', getSupabaseUrl())
  console.log('Supabase Key exists:', !!getSupabaseKey())
}

// Browser client for client-side auth
export const supabaseBrowserClient = createBrowserClient(
  getSupabaseUrl(),
  getSupabaseKey()
)

// Helper to get auth headers for API calls
export async function getAuthHeaders() {
  const { data: { session } } = await supabaseBrowserClient.auth.getSession()
  return {
    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
  }
}
