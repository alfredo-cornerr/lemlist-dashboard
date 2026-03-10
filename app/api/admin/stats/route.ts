import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper to verify user from token and check admin status
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, isAdmin: false }
  }
  
  const token = authHeader.substring(7)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { user: null, isAdmin: false }
  }

  // Check admin status
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  
  return { user, isAdmin: profile?.is_admin || false }
}

export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await verifyAdmin(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { count: totalUsers, error: error1 } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (error1) throw error1

    const { count: activeUsers, error: error2 } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .not("lemlist_api_key", "is", null)

    if (error2) throw error2

    const { count: todaySignups, error: error3 } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error3) throw error3

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      todaySignups: todaySignups || 0,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
