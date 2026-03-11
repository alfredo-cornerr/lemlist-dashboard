import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } from "@/lib/supabase-config"

// Helper to verify user from token and check admin status
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, isAdmin: false }
  }
  
  const token = authHeader.substring(7)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { user: null, isAdmin: false }
  }

  // Check admin status
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
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

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data, error } = await supabaseAdmin
      .from("activity_logs")
      .select(`
        *,
        user:user_id (email)
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      throw new Error(`Failed to fetch activity: ${error.message}`)
    }

    const formatted = (data || []).map((log: any) => ({
      ...log,
      user_email: log.user?.email,
    }))

    return NextResponse.json({ activity: formatted })
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
