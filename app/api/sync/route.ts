import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET - Check sync status and get cached data
export async function GET(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // Verify token
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      )
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get latest sync info
    const { data: latestSync } = await supabaseAdmin
      .from('lemlist_sync_log')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()
    
    // Check if data is stale (older than 1 hour)
    const isStale = !latestSync || 
      (latestSync.status === 'completed' && 
       new Date(latestSync.completed_at!).getTime() < Date.now() - 3600000)
    
    return NextResponse.json({
      sync: latestSync,
      isStale,
      lastSync: latestSync?.completed_at,
      campaignsSynced: latestSync?.campaigns_synced || 0,
      leadsSynced: latestSync?.leads_synced || 0,
    })
    
  } catch (error) {
    console.error("Error checking sync status:", error)
    return NextResponse.json(
      { error: "Failed to check sync status" },
      { status: 500 }
    )
  }
}

// POST - Trigger a sync (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user is admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }
    
    // For now, just return instructions
    // The actual sync should be run via the script or scheduled job
    return NextResponse.json({
      message: "To sync data, run: npx tsx scripts/sync-lemlist-data.ts " + user.id,
      note: "For production, set up a cron job or use a scheduler like GitHub Actions"
    })
    
  } catch (error) {
    console.error("Error triggering sync:", error)
    return NextResponse.json(
      { error: "Failed to trigger sync" },
      { status: 500 }
    )
  }
}
