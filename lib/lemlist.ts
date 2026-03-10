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
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.string(),
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

  // Get campaign stats
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const data = await this.fetch<any>(`/campaigns/${campaignId}/stats`)
    return {
      sent: data.sent || 0,
      opened: data.opened || 0,
      clicked: data.clicked || 0,
      replied: data.replied || 0,
      bounced: data.bounced || 0,
      unsubscribed: data.unsubscribed || 0,
    }
  }

  // Get campaign leads
  async getCampaignLeads(campaignId: string): Promise<Lead[]> {
    const data = await this.fetch<any[]>(`/campaigns/${campaignId}/leads`)
    return data.map((lead) => ({
      _id: lead._id,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      status: lead.status,
      lastActivityAt: lead.lastActivityAt,
    }))
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
