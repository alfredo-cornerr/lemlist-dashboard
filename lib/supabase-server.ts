import { createServerClient as createSupabaseServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a server-side Supabase client with cookie-based auth
export async function createServerClient() {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
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

// Admin client for database operations (no auth needed - service role)
const adminClient = createSupabaseServerClient(supabaseUrl, supabaseServiceKey, {
  cookies: {
    get() { return undefined },
    set() {},
    remove() {},
  },
})

export const supabaseAdmin = adminClient

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

// Get current user with profile (including is_admin)
export async function getCurrentUserWithProfile() {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Error fetching profile:", error)
      return { user, profile: null, isAdmin: false }
    }

    return {
      user,
      profile,
      isAdmin: profile?.is_admin || false,
    }
  } catch (error) {
    console.error("Error in getCurrentUserWithProfile:", error)
    return { user, profile: null, isAdmin: false }
  }
}

// Check if current user is admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userWithProfile = await getCurrentUserWithProfile()
  return userWithProfile?.isAdmin || false
}

// Get user's Lemlist API key (decrypted)
export async function getUserLemlistApiKey(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("lemlist_api_key")
      .eq("id", userId)
      .single()
    
    if (error || !data?.lemlist_api_key) {
      return null
    }
    
    return data.lemlist_api_key
  } catch (error) {
    console.error("Error getting API key:", error)
    return null
  }
}

// Update user's Lemlist API key
export async function updateUserLemlistApiKey(userId: string, apiKey: string) {
  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ 
        lemlist_api_key: apiKey,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
    
    if (error) {
      throw new Error(`Failed to update API key: ${error.message}`)
    }
  } catch (error) {
    console.error("Error updating API key:", error)
    throw error
  }
}
