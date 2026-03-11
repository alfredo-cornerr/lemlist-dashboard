"use client"

import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config"

// Browser client for client-side auth
export const supabaseBrowserClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

// Helper to get auth headers for API calls
export async function getAuthHeaders() {
  const { data: { session } } = await supabaseBrowserClient.auth.getSession()
  return {
    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
  }
}
