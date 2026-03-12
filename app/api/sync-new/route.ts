import { NextRequest, NextResponse } from "next/server"
import { LemlistClient } from "@/lib/lemlist"
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

const supabaseUrl = SUPABASE_URL
const supabaseServiceKey = SUPABASE_SERVICE_KEY
const supabaseAnonKey = SUPABASE_ANON_KEY

// Helper to verify user from token
async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  
  // Verify token with Supabase
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (!res.ok) {
    return null
  }
  
  const data = await res.json()
  return data
}

// POST - Trigger sync using LemlistClient
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get user's API key
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=lemlist_api_key&id=eq.${user.id}`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
    })
    
    const profiles = await profileRes.json()
    const apiKey = profiles[0]?.lemlist_api_key
    
    if (!apiKey) {
      return NextResponse.json({ error: "No API key found" }, { status: 400 })
    }
    
    // Use LemlistClient (same as test connection)
    const client = new LemlistClient(apiKey)
    
    // Fetch campaigns
    const campaigns = await client.getCampaigns()
    
    let totalLeads = 0
    
    // Process each campaign
    for (const campaign of campaigns.slice(0, 50)) {
      const campaignId = campaign._id
      
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
          user_id: user.id,
          campaign_id: campaignId,
          name: campaign.name,
          status: campaign.status || 'unknown',
          updated_at: new Date().toISOString(),
        }),
      })
      
      try {
        // Fetch leads
        const leads = await client.getCampaignLeads(campaignId)
        totalLeads += leads.length
        
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
              user_id: user.id,
              campaign_id: campaignId,
              lead_id: lead._id,
              email: lead.email,
              first_name: lead.firstName,
              last_name: lead.lastName,
              status: lead.status || 'unknown',
            }),
          })
          
          if (lead.sent) sent++
          if (lead.opened) opened++
          if (lead.replied) replied++
          if (lead.clicked) clicked++
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
            user_id: user.id,
            campaign_id: campaignId,
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
        console.error(`Error processing campaign ${campaignId}:`, e)
      }
    }
    
    return NextResponse.json({
      success: true,
      campaigns: campaigns.length,
      leads: totalLeads,
    })
    
  } catch (error: any) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 })
  }
}
