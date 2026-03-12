import { NextRequest, NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      return NextResponse.json({ error: data.msg || data.error || "Login failed" }, { status: res.status })
    }
    
    return NextResponse.json({ user: data.user, session: data.session })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
