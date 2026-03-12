import { NextRequest, NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

const supabaseUrl = SUPABASE_URL
const supabaseServiceKey = SUPABASE_SERVICE_KEY
const supabaseAnonKey = SUPABASE_ANON_KEY

// Helper to verify user from token
async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (!res.ok) {
    return null
  }
  
  const data = await res.json()
  return data
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get profile from database
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
    })

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    const profiles = await profileRes.json()
    const profile = profiles[0] || {}

    return NextResponse.json({
      id: user.id,
      email: user.email,
      is_admin: profile.is_admin || false,
      lemlist_api_key: profile.lemlist_api_key || null,
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
