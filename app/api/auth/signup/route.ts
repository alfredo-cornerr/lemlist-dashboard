import { NextRequest, NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log("Signup attempt:", email)
    console.log("Supabase URL:", SUPABASE_URL)
    
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    
    const data = await res.json()
    console.log("Supabase response:", res.status, data)
    
    if (!res.ok) {
      return NextResponse.json({ error: data.msg || data.error || "Signup failed" }, { status: res.status })
    }
    
    return NextResponse.json({ user: data.user, session: data.session })
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
