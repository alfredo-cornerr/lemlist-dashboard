import { NextRequest, NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Get the origin from request or use production URL
    const origin = request.headers.get('origin') || 'https://lemlist-portal.vercel.app'
    
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        password,
        options: {
          email_redirect_to: `${origin}/auth/callback`
        }
      }),
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      return NextResponse.json({ error: data.msg || data.error || "Signup failed" }, { status: res.status })
    }
    
    return NextResponse.json({ user: data.user, session: data.session })
  } catch (error: any) {
    console.error("Signup error:", error.message)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
