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

    const { data, error } = await supabaseAdmin
      .from("admin_users_view")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return NextResponse.json({ users: data || [] })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, isAdmin } = await verifyAdmin(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, isAdmin: makeAdmin } = await request.json()
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_admin: makeAdmin, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, isAdmin } = await verifyAdmin(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await request.json()
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
