import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { LemlistClient } from "@/lib/lemlist"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  console.log("=== CAMPAIGNS API CALLED ===")
  
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    console.log("Auth header present:", !!authHeader)
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("ERROR: No Bearer token")
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    console.log("Token length:", token.length)
    
    // Verify token using anon client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.log("Auth error:", authError)
    }
    
    if (!user) {
      console.log("ERROR: No user found")
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      )
    }

    console.log("User authenticated:", user.id)

    // Get user's API key using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    console.log("Fetching profile for user:", user.id)
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("lemlist_api_key")
      .eq("id", user.id)
      .single()

    console.log("Profile query result:")
    console.log("  - profile:", profile)
    console.log("  - error:", profileError)
    console.log("  - has api_key:", !!profile?.lemlist_api_key)

    if (profileError) {
      console.log("Profile error:", profileError)
    }

    if (!profile?.lemlist_api_key) {
      console.log("ERROR: No API key found in profile")
      return NextResponse.json(
        { error: "Lemlist API key not configured" },
        { status: 400 }
      )
    }

    console.log("API key found, fetching campaigns from Lemlist...")

    const client = new LemlistClient(profile.lemlist_api_key)
    const campaigns = await client.getCampaigns()

    console.log("Campaigns fetched successfully:", campaigns.length)

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error("ERROR fetching campaigns:", error)
    
    if (error instanceof Error) {
      if (error.message.includes("Invalid API key")) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your settings." },
          { status: 401 }
        )
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "API rate limit exceeded. Please try again later." },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    )
  }
}
