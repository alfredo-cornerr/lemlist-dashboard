import { z } from "zod"

// Lemlist API Types
export const CampaignSchema = z.object({
  _id: z.string(),
  name: z.string(),
  status: z.enum(["running", "paused", "stopped"]),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CampaignStatsSchema = z.object({
  sent: z.number(),
  opened: z.number(),
  clicked: z.number(),
  replied: z.number(),
  bounced: z.number(),
  unsubscribed: z.number(),
})

export const LeadSchema = z.object({
  _id: z.string(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.string().optional(),  // Mapped from 'state' field
  state: z.string().optional(),   // Raw state from API
  contactId: z.string().optional(),
  lastActivityAt: z.string().optional(),
})

export const SequenceStepSchema = z.object({
  _id: z.string(),
  name: z.string(),
  type: z.enum(["email", "linkedin", "call", "manual", "api"]),
  delay: z.number(),
})

export type Campaign = z.infer<typeof CampaignSchema>
export type CampaignStats = z.infer<typeof CampaignStatsSchema>
export type Lead = z.infer<typeof LeadSchema>
export type SequenceStep = z.infer<typeof SequenceStepSchema>

// Lemlist API Error
export class LemlistAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: Response
  ) {
    super(message)
    this.name = "LemlistAPIError"
  }
}

// Lemlist API Client
export class LemlistClient {
  private apiKey: string
  private baseUrl = "https://api.lemlist.com/api"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}${endpoint.includes("?") ? "&" : "?"}access_token=${this.apiKey}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new LemlistAPIError("Invalid API key. Please check your credentials.", 401, response)
        }
        if (response.status === 429) {
          throw new LemlistAPIError("API rate limit exceeded. Please try again later.", 429, response)
        }
        if (response.status === 404) {
          throw new LemlistAPIError("Resource not found.", 404, response)
        }
        throw new LemlistAPIError(
          `API request failed: ${response.statusText}`,
          response.status,
          response
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof LemlistAPIError) {
        throw error
      }
      throw new LemlistAPIError(
        error instanceof Error ? error.message : "Network error occurred"
      )
    }
  }

  // Test the API key
  async testConnection(): Promise<boolean> {
    try {
      await this.fetch("/campaigns")
      return true
    } catch (error) {
      if (error instanceof LemlistAPIError && error.statusCode === 401) {
        return false
      }
      throw error
    }
  }

  // Get all campaigns
  async getCampaigns(): Promise<Campaign[]> {
    const data = await this.fetch<any[]>("/campaigns")
    return data.map((campaign) => ({
      _id: campaign._id,
      name: campaign.name,
      status: campaign.status,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    }))
  }

  // Get campaign details
  async getCampaign(campaignId: string): Promise<Campaign> {
    const data = await this.fetch<any>(`/campaigns/${campaignId}`)
    return {
      _id: data._id,
      name: data.name,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }

  // Get campaign stats - calculated from leads since /stats endpoint returns error
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    try {
      // Try the stats endpoint first
      const data = await this.fetch<any>(`/campaigns/${campaignId}/stats`)
      return {
        sent: data.sent || 0,
        opened: data.opened || 0,
        clicked: data.clicked || 0,
        replied: data.replied || 0,
        bounced: data.bounced || 0,
        unsubscribed: data.unsubscribed || 0,
      }
    } catch {
      // If stats endpoint fails, calculate from leads
      const leads = await this.getCampaignLeads(campaignId)
      
      const stats = {
        sent: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        bounced: 0,
        unsubscribed: 0,
      }
      
      for (const lead of leads) {
        const state = lead.status || lead.state || ''
        
        // Count based on lead state
        if (state.includes('sent') || state === 'emailsSent') {
          stats.sent++
        }
        if (state.includes('opened') || state === 'emailsOpened') {
          stats.opened++
        }
        if (state.includes('clicked') || state === 'emailsClicked') {
          stats.clicked++
        }
        if (state.includes('replied') || state === 'emailsReplied' || state === 'linkedinReplied') {
          stats.replied++
        }
        if (state.includes('bounced') || state === 'emailsBounced') {
          stats.bounced++
        }
        if (state.includes('unsubscribed') || state === 'variableUnsubscribed') {
          stats.unsubscribed++
        }
      }
      
      // If no leads counted as sent, count all non-scanned leads
      if (stats.sent === 0 && leads.length > 0) {
        stats.sent = leads.filter(l => {
          const state = l.status || l.state || ''
          return state !== 'scanned' && state !== 'toScan'
        }).length
      }
      
      return stats
    }
  }

  // Get campaign leads (with pagination to get ALL leads - up to 50,000)
  async getCampaignLeads(campaignId: string): Promise<Lead[]> {
    const allLeads: any[] = []
    let offset = 0
    const limit = 100
    
    // Keep fetching until we get fewer than limit results
    while (true) {
      try {
        const data = await this.fetch<any[]>(`/campaigns/${campaignId}/leads?offset=${offset}&limit=${limit}`)
        
        if (data.length === 0) {
          break
        }
        
        allLeads.push(...data)
        
        // If we got fewer than limit, we've reached the end
        if (data.length < limit) {
          break
        }
        
        offset += limit
        
        // Safety limit - don't fetch more than 50,000 leads (500 API calls max)
        if (offset > 50000) {
          console.warn(`Campaign ${campaignId} has more than 50,000 leads, truncating`)
          break
        }
        
        // Add delay every 10 requests to avoid rate limits (20 req/min limit)
        if (offset % 1000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      } catch (error) {
        // If rate limited, wait and retry
        if (error instanceof LemlistAPIError && error.statusCode === 429) {
          console.log(`Rate limited, waiting 3 seconds...`)
          await new Promise(resolve => setTimeout(resolve, 3000))
          continue // Retry same offset
        }
        throw error
      }
    }
    
    return allLeads.map((lead) => ({
      _id: lead._id,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      status: lead.state || lead.status,  // Map 'state' to 'status' for consistency
      state: lead.state,
      contactId: lead.contactId,
      lastActivityAt: lead.lastActivityAt,
    }))
  }

  // Get contact details by ID
  async getContact(contactId: string): Promise<{ _id: string; email: string; fullName: string; firstName?: string; lastName?: string; linkedinUrl?: string } | null> {
    try {
      const data = await this.fetch<any>(`/contacts/${contactId}`)
      return {
        _id: data._id,
        email: data.email,
        fullName: data.fullName,
        firstName: data.fields?.firstName,
        lastName: data.fields?.lastName,
        linkedinUrl: data.linkedinUrl,
      }
    } catch {
      return null
    }
  }

  // Get campaign leads enriched with contact data
  async getCampaignLeadsEnriched(campaignId: string, limit: number = 50): Promise<Lead[]> {
    const leads = await this.getCampaignLeads(campaignId)
    const limitedLeads = leads.slice(0, limit)
    
    // Enrich with contact data (with delay to avoid rate limits)
    const enrichedLeads: Lead[] = []
    for (const lead of limitedLeads) {
      if (lead.contactId) {
        // Wait 50ms between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 50))
        const contact = await this.getContact(lead.contactId)
        if (contact) {
          enrichedLeads.push({
            ...lead,
            email: contact.email,
            firstName: contact.firstName || contact.fullName?.split(' ')[0],
            lastName: contact.lastName || contact.fullName?.split(' ').slice(1).join(' '),
          })
        } else {
          enrichedLeads.push(lead)
        }
      } else {
        enrichedLeads.push(lead)
      }
    }
    
    return enrichedLeads
  }

  // Get campaign sequence
  async getCampaignSequence(campaignId: string): Promise<SequenceStep[]> {
    const data = await this.fetch<any[]>(`/campaigns/${campaignId}/sequence`)
    return data.map((step, index) => ({
      _id: step._id || `step-${index}`,
      name: step.name || `Step ${index + 1}`,
      type: step.type,
      delay: step.delay || 0,
    }))
  }
}

// Server-side helper to create client with user's API key
export async function createLemlistClient(apiKey: string): Promise<LemlistClient> {
  return new LemlistClient(apiKey)
}
