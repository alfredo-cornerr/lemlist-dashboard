import { NextRequest, NextResponse } from "next/server"
import { supabaseApi } from "@/lib/supabase-api"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Verify user via REST API
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      }
    })
    
    if (!userRes.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const user = await userRes.json()
    
    if (!user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get campaigns via RPC
    const { data: campaigns } = await supabaseApi.rpc('get_latest_campaign_stats', { 
      p_user_id: user.id 
    })
    
    return NextResponse.json({
      campaigns: campaigns || [],
      lastSynced: new Date().toISOString(),
      isStale: false
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
