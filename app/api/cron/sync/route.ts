import { NextRequest, NextResponse } from "next/server"
import { LemlistClient } from "@/lib/lemlist"
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "@/lib/supabase-config"

const supabaseUrl = SUPABASE_URL
const supabaseServiceKey = SUPABASE_SERVICE_KEY

// This runs every hour via Vercel Cron
export async function GET(request: NextRequest) {
  // Verify it's a cron request or admin
  const authHeader = request.headers.get('authorization')
  const isCron = request.headers.get('x-vercel-cron') === '1'
  
  if (!isCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all users with API keys
    const usersRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,lemlist_api_key&lemlist_api_key=not.is.null`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
    })
    
    const users = await usersRes.json()
    
    for (const user of users) {
      try {
        await syncUser(user.id, user.lemlist_api_key)
      } catch (e) {
        console.error(`Failed to sync user ${user.id}:`, e)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      usersSynced: users.length 
    })
  } catch (error: any) {
    console.error("Cron sync error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function syncUser(userId: string, apiKey: string) {
  const client = new LemlistClient(apiKey)
  
  // Get campaigns
  const campaigns = await client.getCampaigns()
  
  for (const campaign of campaigns.slice(0, 30)) {
    // Save campaign
    await fetch(`${supabaseUrl}/rest/v1/lemlist_campaigns`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        campaign_id: campaign._id,
        name: campaign.name,
        status: campaign.status || 'unknown',
        updated_at: new Date().toISOString(),
      }),
    })
    
    try {
      // Get leads (first 100 only to save time)
      const leads = await client.getCampaignLeads(campaign._id)
      
      let sent = 0, opened = 0, replied = 0, clicked = 0
      
      for (const lead of leads) {
        await fetch(`${supabaseUrl}/rest/v1/lemlist_leads`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: userId,
            campaign_id: campaign._id,
            lead_id: lead._id,
            email: lead.email,
            first_name: lead.firstName,
            last_name: lead.lastName,
            status: lead.status || 'unknown',
          }),
        })
        
        const leadAny = lead as any
        if (leadAny.sent) sent++
        if (leadAny.opened) opened++
        if (leadAny.replied) replied++
        if (leadAny.clicked) clicked++
      }
      
      // Save stats
      const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0
      const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0
      
      await fetch(`${supabaseUrl}/rest/v1/lemlist_campaign_stats`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          campaign_id: campaign._id,
          sent,
          opened,
          replied,
          clicked,
          leads: leads.length,
          open_rate: openRate,
          reply_rate: replyRate,
        }),
      })
    } catch (e) {
      console.error(`Error processing campaign ${campaign._id}:`, e)
    }
  }
}
