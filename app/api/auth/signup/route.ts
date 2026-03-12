import { NextRequest, NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log("1. Starting signup for:", email)
    console.log("2. URL:", SUPABASE_URL)
    
    let res
    try {
      res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      console.log("3. Fetch succeeded, status:", res.status)
    } catch (fetchError: any) {
      console.error("3. Fetch failed:", fetchError.message)
      return NextResponse.json({ error: "Network error: " + fetchError.message }, { status: 500 })
    }
    
    let data
    try {
      data = await res.json()
      console.log("4. JSON parsed:", data)
    } catch (jsonError: any) {
      console.error("4. JSON parse failed:", jsonError.message)
      return NextResponse.json({ error: "Invalid JSON response" }, { status: 500 })
    }
    
    if (!res.ok) {
      console.log("5. Response not OK:", res.status)
      return NextResponse.json({ error: data.msg || data.error || "Signup failed" }, { status: res.status })
    }
    
    console.log("6. Success!")
    return NextResponse.json({ user: data.user, session: data.session })
  } catch (error: any) {
    console.error("TOP LEVEL ERROR:", error.message)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
// Thu Mar 12 02:59:00 CET 2026
