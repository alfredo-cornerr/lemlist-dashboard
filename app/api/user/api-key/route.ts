import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } from "@/lib/supabase-config"

const supabaseUrl = SUPABASE_URL
const supabaseAnonKey = SUPABASE_ANON_KEY
const supabaseServiceKey = SUPABASE_SERVICE_KEY

// Helper to verify user from token
async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("lemlist_api_key")
      .eq("id", user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to check API key" }, { status: 500 })
    }

    return NextResponse.json({ hasKey: !!data?.lemlist_api_key })
  } catch (error) {
    console.error("Error checking API key:", error)
    return NextResponse.json({ error: "Failed to check API key" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ 
        lemlist_api_key: apiKey,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (error) {
      throw new Error(`Failed to save API key: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving API key:", error)
    return NextResponse.json({ error: "Failed to save API key" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ 
        lemlist_api_key: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (error) {
      throw new Error(`Failed to revoke API key: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking API key:", error)
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 })
  }
}
