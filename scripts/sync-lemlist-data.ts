import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface LeadState {
  total: number
  scanned: number
  emailsSent: number
  emailsOpened: number
  emailsClicked: number
  emailsReplied: number
  emailsBounced: number
  linkedinInviteAccepted: number
  linkedinReplied: number
  unsubscribed: number
  [key: string]: number
}

async function syncUserData(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log(`\n🚀 Starting sync for user: ${userId}`)
  console.log(`   This will fetch ALL leads from all campaigns...`)
  const startTime = Date.now()
  
  const { data: syncLog, error: syncError } = await supabase
    .from('lemlist_sync_log')
    .insert({ user_id: userId, status: 'running' })
    .select()
    .single()
  
  if (syncError || !syncLog) {
    console.error('Failed to create sync log:', syncError)
    return
  }
  
  const syncId = syncLog.id
  
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('lemlist_api_key')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile?.lemlist_api_key) {
      throw new Error('No API key found for user')
    }
    
    const apiKey = profile.lemlist_api_key
    
    console.log('📊 Fetching campaigns...')
    const campaignsRes = await fetch(`https://api.lemlist.com/api/campaigns?access_token=${apiKey}`)
    if (!campaignsRes.ok) throw new Error('Failed to fetch campaigns')
    const campaigns = await campaignsRes.json()
    console.log(`  Found ${campaigns.length} campaigns`)
    
    let totalLeadsSynced = 0
    
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i]
      console.log(`\n📧 [${i + 1}/${campaigns.length}] ${campaign.name}`)
      
      await supabase.from('lemlist_campaigns').upsert({
        _id: campaign._id,
        user_id: userId,
        name: campaign.name,
        status: campaign.status,
        sequence_id: campaign.sequenceId,
        created_at: campaign.createdAt,
        updated_at: campaign.updatedAt,
        cached_at: new Date().toISOString()
      }, { onConflict: '_id' })
      
      console.log('  Fetching leads...')
      const allLeads: any[] = []
      let offset = 0
      const limit = 100
      
      while (true) {
        try {
          const url = `https://api.lemlist.com/api/campaigns/${campaign._id}/leads?access_token=${apiKey}&offset=${offset}&limit=${limit}`
          const response = await fetch(url)
          
          if (!response.ok) {
            if (response.status === 429) {
              console.log('  ⏳ Rate limited, waiting 3s...')
              await new Promise(r => setTimeout(r, 3000))
              continue
            }
            break
          }
          
          const leads = await response.json()
          if (leads.length === 0) break
          
          allLeads.push(...leads)
          
          if (leads.length < limit) break
          offset += limit
          
          if (offset % 1000 === 0) {
            console.log(`    Loaded ${allLeads.length} leads...`)
          }
          
          // No limit - fetch ALL leads
          if (offset > 50000) {
            console.log('    ⚠️  Reached 50k safety limit')
            break
          }
        } catch (e) {
          console.error('  Error:', e)
          break
        }
      }
      
      console.log(`  ✓ Total leads: ${allLeads.length}`)
      totalLeadsSynced += allLeads.length
      
      const states: LeadState = {
        total: allLeads.length, scanned: 0, emailsSent: 0,
        emailsOpened: 0, emailsClicked: 0, emailsReplied: 0,
        emailsBounced: 0, linkedinInviteAccepted: 0,
        linkedinReplied: 0, unsubscribed: 0
      }
      
      for (const lead of allLeads) {
        const state = lead.state || 'unknown'
        states[state] = (states[state] || 0) + 1
      }
      
      const openRate = states.emailsSent > 0 
        ? Math.round((states.emailsOpened / states.emailsSent) * 100 * 100) / 100 : 0
      const replyRate = states.emailsSent > 0 
        ? Math.round(((states.emailsReplied + states.linkedinReplied) / states.emailsSent) * 100 * 100) / 100 : 0
      
      console.log(`     📧 Emails Sent: ${states.emailsSent}`)
      console.log(`     👀 Opened: ${states.emailsOpened} (${openRate}%)`)
      console.log(`     💬 Replied: ${states.emailsReplied + states.linkedinReplied} (${replyRate}%)`)
      
      await supabase.from('lemlist_campaign_stats').insert({
        campaign_id: campaign._id,
        user_id: userId,
        total_leads: states.total,
        scanned: states.scanned,
        emails_sent: states.emailsSent,
        emails_opened: states.emailsOpened,
        emails_clicked: states.emailsClicked,
        emails_replied: states.emailsReplied,
        emails_bounced: states.emailsBounced,
        linkedin_invite_accepted: states.linkedinInviteAccepted,
        linkedin_replied: states.linkedinReplied,
        unsubscribed: states.unsubscribed,
        open_rate: openRate,
        reply_rate: replyRate,
        click_rate: states.emailsSent > 0 ? Math.round((states.emailsClicked / states.emailsSent) * 100 * 100) / 100 : 0,
        raw_states: states
      })
      
      await supabase.from('lemlist_campaigns')
        .update({ total_leads: states.total })
        .eq('_id', campaign._id)
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    await supabase.from('lemlist_sync_log').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      campaigns_synced: campaigns.length,
      leads_synced: totalLeadsSynced,
      duration_seconds: duration
    }).eq('id', syncId)
    
    console.log(`\n✅ Sync completed in ${duration}s`)
    console.log(`   Campaigns: ${campaigns.length}`)
    console.log(`   Total Leads: ${totalLeadsSynced}`)
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error)
    await supabase.from('lemlist_sync_log').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error',
      duration_seconds: Math.round((Date.now() - startTime) / 1000)
    }).eq('id', syncId)
  }
}

async function main() {
  const userId = process.argv[2] || process.env.USER_ID
  if (!userId) {
    console.error('Usage: npx tsx scripts/sync-lemlist-data.ts <user_id>')
    process.exit(1)
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Supabase env vars not set')
    process.exit(1)
  }
  await syncUserData(userId)
}

main()
