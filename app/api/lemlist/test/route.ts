import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { LemlistClient } from "@/lib/lemlist"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { success: false, error: "API key is required" },
        { status: 400 }
      )
    }

    console.log("Testing Lemlist API key...")
    const client = new LemlistClient(apiKey)
    
    try {
      const campaigns = await client.getCampaigns()
      console.log("Test successful! Found", campaigns.length, "campaigns")
      
      return NextResponse.json({ 
        success: true, 
        campaignsCount: campaigns.length,
        message: `Connected! Found ${campaigns.length} campaigns.`
      })
    } catch (err) {
      console.error("Lemlist API test failed:", err)
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : "Invalid API key" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Error testing Lemlist connection:", error)
    return NextResponse.json(
      { success: false, error: "Failed to test connection" },
      { status: 500 }
    )
  }
}

// GET endpoint to test with saved API key
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("lemlist_api_key")
      .eq("id", user.id)
      .single()

    if (!profile?.lemlist_api_key) {
      return NextResponse.json({ error: "No API key configured" }, { status: 400 })
    }

    const client = new LemlistClient(profile.lemlist_api_key)
    const campaigns = await client.getCampaigns()

    return NextResponse.json({ 
      success: true, 
      campaignsCount: campaigns.length,
      campaigns: campaigns.slice(0, 3) // Return first 3 for preview
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}
