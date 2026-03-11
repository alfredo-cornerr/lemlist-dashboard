import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const API_KEY = '3e5e4115b622ee03d539cf1b796c293d'
const USER_ID = '53ffa8c8-95ae-44df-920a-afec2d17158f'

async function sync() {
  console.log('🚀 Starting accurate sync...\n')
  
  // Get campaigns
  const campaignsRes = await fetch(`https://api.lemlist.com/api/campaigns?access_token=${API_KEY}`)
  const campaigns = await campaignsRes.json()
  
  console.log(`Found ${campaigns.length} campaigns\n`)
  
  for (const campaign of campaigns) {
    console.log(`📧 ${campaign.name}`)
    
    // Save campaign
    await supabase.from('lemlist_campaigns').upsert({
      _id: campaign._id,
      user_id: USER_ID,
      name: campaign.name,
      status: campaign.status,
      cached_at: new Date().toISOString()
    }, { onConflict: '_id' })
    
    // Count leads properly
    let totalLeads = 0
    let offset = 0
    
    while (true) {
      const res = await fetch(
        `https://api.lemlist.com/api/campaigns/${campaign._id}/leads?access_token=${API_KEY}&offset=${offset}&limit=100`
      )
      
      if (!res.ok) {
        if (res.status === 429) {
          await new Promise(r => setTimeout(r, 3000))
          continue
        }
        break
      }
      
      const leads = await res.json()
      if (leads.length === 0) break
      
      totalLeads += leads.length
      offset += 100
      
      if (offset > 10000) break // Safety limit
    }
    
    console.log(`  Total leads: ${totalLeads}`)
    
    // Update with correct count
    await supabase.from('lemlist_campaigns')
      .update({ total_leads: totalLeads })
      .eq('_id', campaign._id)
    
    // Save stats (just totals for now)
    await supabase.from('lemlist_campaign_stats').insert({
      campaign_id: campaign._id,
      user_id: USER_ID,
      total_leads: totalLeads,
      emails_sent: 0, // We'll calculate these separately
      emails_opened: 0,
      emails_replied: 0
    })
  }
  
  console.log('\n✅ Sync complete!')
}

sync().catch(console.error)
