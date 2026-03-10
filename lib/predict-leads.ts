import { z } from 'zod'

// Predict Leads API Client
const PREDICT_LEADS_BASE_URL = process.env.PREDICT_LEADS_BASE_URL || 'https://api.predictleads.com/v3'
const AUTH_KEY = process.env.PREDICT_LEADS_AUTH_KEY
const AUTH_TOKEN = process.env.PREDICT_LEADS_AUTH_TOKEN

// Company Types
export const CompanySchema = z.object({
  id: z.string(),
  type: z.literal('company'),
  attributes: z.object({
    domain: z.string(),
    company_name: z.string().nullable(),
    ticker: z.string().nullable(),
    friendly_company_name: z.string(),
    meta_title: z.string(),
    meta_description: z.string(),
    description: z.string().nullable(),
    description_short: z.string().nullable(),
    language: z.string(),
    location: z.string().nullable(),
    location_data: z.array(z.object({
      city: z.string().nullable(),
      state: z.string().nullable(),
      zip_code: z.string().nullable(),
      country: z.string().nullable(),
      region: z.string().nullable(),
      continent: z.string().nullable(),
      fuzzy_match: z.boolean().nullable(),
    })).optional(),
  }),
})

export const SimilarCompanySchema = z.object({
  id: z.string(),
  type: z.literal('company_similarity'),
  attributes: z.object({
    score: z.number().min(0).max(1),
    position: z.number().min(1).max(50).nullable(),
    reason: z.string().nullable(),
    refreshed_at: z.string(),
  }),
})

export const JobOpeningSchema = z.object({
  id: z.string(),
  type: z.literal('job_opening'),
  attributes: z.object({
    title: z.string(),
    description: z.string().nullable(),
    url: z.string(),
    first_seen_at: z.string(),
    last_seen_at: z.string(),
    contract_types: z.array(z.string()),
    categories: z.array(z.string()),
    onet_data: z.object({
      code: z.string().nullable(),
      family: z.string().nullable(),
      occupation_name: z.string().nullable(),
    }),
    posted_at: z.string().nullable(),
    recruiter_data: z.object({
      name: z.string().nullable(),
      title: z.string().nullable(),
      contact: z.string().nullable(),
    }),
    salary: z.string().nullable(),
    salary_data: z.object({
      salary_low: z.number().nullable(),
      salary_high: z.number().nullable(),
      salary_currency: z.string().nullable(),
      salary_low_usd: z.number().nullable(),
      salary_high_usd: z.number().nullable(),
      salary_time_unit: z.string().nullable(),
    }),
    seniority: z.string().nullable(),
    status: z.string().nullable(),
    language: z.string().nullable(),
    location: z.string().nullable(),
    location_data: z.array(z.any()).optional(),
    tags: z.array(z.string()),
  }),
})

export const TechnologyDetectionSchema = z.object({
  id: z.string(),
  type: z.literal('technology_detection'),
  attributes: z.object({
    first_seen_at: z.string(),
    last_seen_at: z.string(),
    behind_firewall: z.boolean(),
    score: z.number(),
  }),
})

export const NewsEventSchema = z.object({
  id: z.string(),
  type: z.literal('news_event'),
  attributes: z.object({
    summary: z.string(),
    category: z.string(),
    found_at: z.string(),
    confidence: z.number(),
    article_sentence: z.string(),
    planning: z.boolean(),
    amount: z.string().nullable(),
    amount_normalized: z.number().nullable(),
    contact: z.string().nullable(),
    event: z.string().nullable(),
    effective_date: z.string().nullable(),
    financing_type: z.string().nullable(),
    headcount: z.number().nullable(),
    job_title: z.string().nullable(),
    location: z.string().nullable(),
  }),
})

export type Company = z.infer<typeof CompanySchema>
export type SimilarCompany = z.infer<typeof SimilarCompanySchema>
export type JobOpening = z.infer<typeof JobOpeningSchema>
export type TechnologyDetection = z.infer<typeof TechnologyDetectionSchema>
export type NewsEvent = z.infer<typeof NewsEventSchema>

// API Error
class PredictLeadsError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'PredictLeadsError'
  }
}

// Base fetch function
async function fetchPredictLeads(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${PREDICT_LEADS_BASE_URL}${endpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/vnd.api+json',
    'X-User-Token': AUTH_TOKEN!,
  }
  
  if (options.headers) {
    Object.assign(headers, options.headers)
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new PredictLeadsError(
      error.message || `API Error: ${response.statusText}`,
      response.status,
      error.code
    )
  }
  
  return response.json()
}

// API Methods
export async function getCompany(domain: string): Promise<Company | null> {
  try {
    const data = await fetchPredictLeads(`/companies/${encodeURIComponent(domain)}`)
    return CompanySchema.parse(data.data)
  } catch (error) {
    if (error instanceof PredictLeadsError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function getSimilarCompanies(
  domain: string,
  options: { page?: number; perPage?: number } = {}
): Promise<{ companies: SimilarCompany[]; count?: number }> {
  const params = new URLSearchParams()
  if (options.page) params.set('page', String(options.page))
  if (options.perPage) params.set('per_page', String(options.perPage))
  
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await fetchPredictLeads(
    `/companies/${encodeURIComponent(domain)}/similar_companies${query}`
  )
  
  return {
    companies: data.data.map((c: any) => SimilarCompanySchema.parse(c)),
    count: data.meta?.count,
  }
}

export async function getJobOpenings(
  domain: string,
  options: { page?: number; perPage?: number; category?: string } = {}
): Promise<{ jobs: JobOpening[]; count?: number }> {
  const params = new URLSearchParams()
  if (options.page) params.set('page', String(options.page))
  if (options.perPage) params.set('per_page', String(options.perPage))
  if (options.category) params.set('category', options.category)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await fetchPredictLeads(
    `/companies/${encodeURIComponent(domain)}/job_openings${query}`
  )
  
  return {
    jobs: data.data.map((j: any) => JobOpeningSchema.parse(j)),
    count: data.meta?.count,
  }
}

export async function getTechnologyDetections(
  domain: string,
  options: { page?: number; perPage?: number } = {}
): Promise<{ technologies: TechnologyDetection[]; count?: number }> {
  const params = new URLSearchParams()
  if (options.page) params.set('page', String(options.page))
  if (options.perPage) params.set('per_page', String(options.perPage))
  
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await fetchPredictLeads(
    `/companies/${encodeURIComponent(domain)}/technology_detections${query}`
  )
  
  return {
    technologies: data.data.map((t: any) => TechnologyDetectionSchema.parse(t)),
    count: data.meta?.count,
  }
}

export async function getNewsEvents(
  domain: string,
  options: { page?: number; perPage?: number; category?: string } = {}
): Promise<{ events: NewsEvent[]; count?: number }> {
  const params = new URLSearchParams()
  if (options.page) params.set('page', String(options.page))
  if (options.perPage) params.set('per_page', String(options.perPage))
  if (options.category) params.set('category', options.category)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await fetchPredictLeads(
    `/companies/${encodeURIComponent(domain)}/news_events${query}`
  )
  
  return {
    events: data.data.map((e: any) => NewsEventSchema.parse(e)),
    count: data.meta?.count,
  }
}

// Search companies by technology
export async function searchCompaniesByTechnology(
  technology: string,
  options: { page?: number; perPage?: number } = {}
): Promise<{ companies: any[]; count?: number }> {
  const params = new URLSearchParams()
  params.set('technology', technology)
  if (options.page) params.set('page', String(options.page))
  if (options.perPage) params.set('per_page', String(options.perPage))
  
  const data = await fetchPredictLeads(`/companies?${params.toString()}`)
  
  return {
    companies: data.data,
    count: data.meta?.count,
  }
}

// Batch lookup for multiple companies
export async function batchGetCompanies(domains: string[]): Promise<Company[]> {
  const results = await Promise.all(
    domains.map(async (domain) => {
      try {
        return await getCompany(domain)
      } catch {
        return null
      }
    })
  )
  return results.filter((c): c is Company => c !== null)
}

export { PredictLeadsError }
