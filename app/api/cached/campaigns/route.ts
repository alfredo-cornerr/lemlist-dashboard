import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: campaigns, error } = await supabaseAdmin
      .rpc('get_latest_campaign_stats', { p_user_id: user.id })
    
    if (error) {
      console.error("Error:", error)
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
    }
    
    const { data: syncLog } = await supabaseAdmin
      .from('lemlist_sync_log')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()
    
    return NextResponse.json({
      campaigns: campaigns || [],
      lastSynced: syncLog?.completed_at,
      isStale: !syncLog || new Date(syncLog.completed_at!).getTime() < Date.now() - 3600000
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
