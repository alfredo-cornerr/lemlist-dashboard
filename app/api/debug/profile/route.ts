import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "No token" }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Verify token
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token", details: authError }, { status: 401 })
    }

    // Get profile using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_admin, lemlist_api_key, created_at, updated_at")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      profile,
      profileError,
      hasApiKey: !!profile?.lemlist_api_key,
      apiKeyFirstChars: profile?.lemlist_api_key ? profile.lemlist_api_key.substring(0, 10) + "..." : null,
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
