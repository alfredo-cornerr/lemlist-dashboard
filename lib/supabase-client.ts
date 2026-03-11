"use client"

import { createClient } from "@supabase/supabase-js"

// HARDCODED - Works guaranteed
const supabaseUrl = "https://uphgcpkjpsrdrdojgjwa.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwaGdjcGtqcHNyZHJkb2pnandhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxOTYwMjgsImV4cCI6MjA1NDc3MjAyOH0.EiaRi5E1-tUj9JY54yJ4L-NNfQmLlaFGeF4jU7hL9xM"

// Debug
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', supabaseUrl)
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
