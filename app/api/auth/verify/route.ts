import { NextRequest, NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 401 })
    }
    
    // Verify token and get user
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!userRes.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const user = await userRes.json()
    
    // Check if profile exists
    const profileCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=id`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })
    
    const existingProfile = await profileCheckRes.json()
    
    // Create profile if doesn't exist
    if (!existingProfile || existingProfile.length === 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          is_admin: false,
        }),
      })
    }
    
    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("Verify error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
