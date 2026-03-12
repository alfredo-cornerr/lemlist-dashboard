import { NextRequest, NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log("API Login attempt:", email)
    console.log("Supabase URL:", SUPABASE_URL)
    
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    
    console.log("Supabase response status:", res.status)
    
    const data = await res.json()
    
    if (!res.ok) {
      console.error("Supabase error:", data)
      return NextResponse.json({ error: data.msg || data.error || "Login failed" }, { status: res.status })
    }
    
    console.log("Login successful")
    
    return NextResponse.json({ 
      user: data.user, 
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at
      }
    })
  } catch (error: any) {
    console.error("Login API error:", error.message)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
