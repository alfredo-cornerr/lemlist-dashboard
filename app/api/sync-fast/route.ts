import { NextRequest, NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

const supabaseUrl = SUPABASE_URL
const supabaseServiceKey = SUPABASE_SERVICE_KEY
const supabaseAnonKey = SUPABASE_ANON_KEY

async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

// Calculate stats from lead data
function calcStats(leads: any[]) {
  let sent = 0, opened = 0, replied = 0, clicked = 0
  for (const lead of leads) {
    // Check activities
    if (lead.activities?.length) {
      for (const act of lead.activities) {
        if (act.type === 'send' || act.type === 'email_sent') sent++
        if (act.type === 'open' || act.type === 'email_opened') opened++
        if (act.type === 'reply' || act.type === 'email_replied') replied++
        if (act.type === 'click' || act.type === 'email_clicked') clicked++
      }
    }
    // Check boolean flags
    if (lead.sent || lead.emailSent) sent++
    if (lead.opened || lead.emailOpened) opened++
    if (lead.replied || lead.emailReplied) replied++
    if (lead.clicked || lead.emailClicked) clicked++
  }
  return { sent, opened, replied, clicked }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=lemlist_api_key&id=eq.${user.id}`, {
      headers: { 'apikey': supabaseServiceKey, 'Authorization': `Bearer ${supabaseServiceKey}` },
    })
    
    const profiles = await profileRes.json()
    const apiKey = profiles[0]?.lemlist_api_key
    if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 400 })
    
    // Get campaigns
    const campRes = await fetch(`https://api.lemlist.com/api/campaigns?access_token=${apiKey}`)
    if (!campRes.ok) throw new Error("Failed to fetch campaigns")
    const campaigns = await campRes.json()
    
    let totalLeads = 0
    
    // Process in parallel (5 at a time)
    for (let i = 0; i < campaigns.length; i += 5) {
      const batch = campaigns.slice(i, i + 5)
      
      await Promise.all(batch.map(async (camp: any) => {
        try {
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
              campaign_id: camp._id,
              name: camp.name,
              status: camp.status || 'unknown',
              updated_at: new Date().toISOString(),
            }),
          })
          
          // Get leads with pagination - fetch all pages
          let allLeads: any[] = []
          let offset = 0
          while (offset < 10000) {
            const leadsRes = await fetch(
              `https://api.lemlist.com/api/campaigns/${camp._id}/leads?limit=100&offset=${offset}&access_token=${apiKey}`
            )
            if (!leadsRes.ok) break
            const leads = await leadsRes.json()
            if (leads.length === 0) break
            allLeads.push(...leads)
            if (leads.length < 100) break
            offset += 100
          }
          
          // Save leads batch
          if (allLeads.length) {
            const batchLeads = allLeads.map(l => ({
              user_id: user.id,
              campaign_id: camp._id,
              lead_id: l._id,
              email: l.email,
              first_name: l.firstName,
              last_name: l.lastName,
              status: l.status || 'unknown',
            }))
            
            await fetch(`${supabaseUrl}/rest/v1/lemlist_leads`, {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates',
              },
              body: JSON.stringify(batchLeads),
            })
          }
          
          // Calculate stats
          const stats = calcStats(allLeads)
          const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0
          const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0
          
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
              campaign_id: camp._id,
              sent: stats.sent,
              opened: stats.opened,
              replied: stats.replied,
              clicked: stats.clicked,
              leads: allLeads.length,
              open_rate: openRate,
              reply_rate: replyRate,
            }),
          })
          
          totalLeads += allLeads.length
        } catch (e) {
          console.error(`Error: ${camp._id}`, e)
        }
      }))
    }
    
    return NextResponse.json({ success: true, campaigns: campaigns.length, leads: totalLeads })
  } catch (error: any) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
