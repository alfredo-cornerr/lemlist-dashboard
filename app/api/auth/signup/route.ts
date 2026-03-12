import { NextRequest, NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log("Signing up:", email)
    
    // Use undici fetch with explicit options
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      // @ts-ignore
      next: { revalidate: 0 },
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      return NextResponse.json({ error: data.msg || data.error || "Signup failed" }, { status: res.status })
    }
    
    return NextResponse.json({ user: data.user, session: data.session })
  } catch (error: any) {
    console.error("Signup error:", error.message, error.cause)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
