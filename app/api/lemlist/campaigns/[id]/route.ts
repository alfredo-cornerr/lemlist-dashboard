import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { LemlistClient } from "@/lib/lemlist"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    
    // Get auth header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // Verify token using anon client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error("Auth error:", authError)
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      )
    }

    // Get user's API key using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("lemlist_api_key")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.lemlist_api_key) {
      return NextResponse.json(
        { error: "Lemlist API key not configured" },
        { status: 400 }
      )
    }

    const client = new LemlistClient(profile.lemlist_api_key)

    const [campaign, stats, leads, sequence] = await Promise.all([
      client.getCampaign(campaignId),
      client.getCampaignStats(campaignId),
      client.getCampaignLeads(campaignId),
      client.getCampaignSequence(campaignId),
    ])

    return NextResponse.json({
      campaign,
      stats,
      leads,
      sequence,
    })
  } catch (error) {
    console.error("Error fetching campaign details:", error)
    
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
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch campaign details" },
      { status: 500 }
    )
  }
}
