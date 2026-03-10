// Real Predict Leads API Client
const BASE_URL = process.env.NEXT_PUBLIC_PREDICT_LEADS_URL || 'https://api.predictleads.com/v3'
const AUTH_KEY = process.env.NEXT_PUBLIC_PREDICT_LEADS_KEY || 'ne4ohcsqwz8rxyyz16ba'
const AUTH_TOKEN = process.env.NEXT_PUBLIC_PREDICT_LEADS_TOKEN || 'zE7etFBaW3gTkDovV_Ub'

interface ApiOptions {
  page?: number
  per_page?: number
}

// Mock data for when API is unavailable
const MOCK_COMPANIES = [
  {
    id: "1",
    type: "company",
    attributes: {
      domain: "stripe.com",
      company_name: "Stripe",
      friendly_company_name: "Stripe",
      location: "San Francisco, California, United States",
      description: "Stripe is a technology company that builds economic infrastructure for the internet.",
      employee_count: "1000+",
      industry: "Financial Services",
    }
  },
  {
    id: "2",
    type: "company",
    attributes: {
      domain: "vercel.com",
      company_name: "Vercel",
      friendly_company_name: "Vercel",
      location: "San Francisco, California, United States",
      description: "Vercel is the platform for frontend developers.",
      employee_count: "201-1000",
      industry: "Software Development",
    }
  },
  {
    id: "3",
    type: "company",
    attributes: {
      domain: "hubspot.com",
      company_name: "HubSpot",
      friendly_company_name: "HubSpot",
      location: "Cambridge, Massachusetts, United States",
      description: "HubSpot is a CRM platform with all the software, integrations, and resources you need.",
      employee_count: "5000+",
      industry: "Software Development",
    }
  },
  {
    id: "4",
    type: "company",
    attributes: {
      domain: "notion.so",
      company_name: "Notion",
      friendly_company_name: "Notion",
      location: "San Francisco, California, United States",
      description: "Notion is the connected workspace where better, faster work happens.",
      employee_count: "201-1000",
      industry: "Software Development",
    }
  },
  {
    id: "5",
    type: "company",
    attributes: {
      domain: "linear.app",
      company_name: "Linear",
      friendly_company_name: "Linear",
      location: "San Francisco, California, United States",
      description: "Linear is a purpose-built tool for planning and building products.",
      employee_count: "51-200",
      industry: "Software Development",
    }
  },
]

// Helper to make API calls with BOTH key and token
async function fetchApi(endpoint: string, options: ApiOptions = {}) {
  const params = new URLSearchParams()
  if (options.page) params.set('page', String(options.page))
  if (options.per_page) params.set('per_page', String(options.per_page))
  
  const query = params.toString() ? `?${params.toString()}` : ''
  const url = `${BASE_URL}${endpoint}${query}`
  
  console.log(`[API] Calling: ${url}`)
  
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'X-User-Key': AUTH_KEY,        // API Key
        'X-User-Token': AUTH_TOKEN,    // API Token
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeout)
    
    console.log(`[API] Response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[API] Error: ${response.status} - ${errorText}`)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log(`[API] Success, got ${data.data?.length || 0} results`)
    return data
  } catch (error) {
    console.error('[API] Fetch failed:', error)
    throw error
  }
}

// ==================== COMPANIES ====================

export async function getCompany(domain: string) {
  return fetchApi(`/companies/${encodeURIComponent(domain)}`)
}

export async function searchCompanies(params: {
  query?: string
  technology?: string
  location?: string
  industry?: string
  company_size?: string
  page?: number
  per_page?: number
}) {
  try {
    // Build query string
    const query = new URLSearchParams()
    if (params.technology) query.set('technology', params.technology)
    if (params.location) query.set('location', params.location)
    if (params.industry) query.set('industry', params.industry)
    if (params.company_size) query.set('company_size', params.company_size)
    if (params.page) query.set('page', String(params.page))
    if (params.per_page) query.set('per_page', String(params.per_page))
    
    const queryString = query.toString()
    
    // If we have filters, use the companies endpoint
    if (queryString) {
      return await fetchApi(`/companies?${queryString}`)
    }
    
    // If just a search query, try to get that specific company or return empty
    if (params.query && params.query.includes('.')) {
      try {
        const company = await getCompany(params.query)
        return {
          data: [company.data],
          meta: { total: 1, page: 1, per_page: 20 }
        }
      } catch {
        return { data: [], meta: { total: 0, page: 1, per_page: 20 } }
      }
    }
    
    // Default: return empty or use a default technology search
    return await fetchApi(`/companies?page=${params.page || 1}&per_page=${params.per_page || 20}`)
  } catch (error) {
    console.log('[API] searchCompanies failed, returning mock data')
    // Return mock data on any error
    return { 
      data: MOCK_COMPANIES, 
      meta: { total: MOCK_COMPANIES.length, page: 1, per_page: 20 } 
    }
  }
}

// ==================== JOB OPENINGS ====================

export async function getJobOpenings(domain: string, options?: ApiOptions) {
  try {
    return await fetchApi(`/companies/${encodeURIComponent(domain)}/job_openings`, options)
  } catch {
    return { data: [] }
  }
}

// ==================== TECHNOLOGY DETECTIONS ====================

export async function getTechnologyDetections(domain: string, options?: ApiOptions) {
  try {
    return await fetchApi(`/companies/${encodeURIComponent(domain)}/technology_detections`, options)
  } catch {
    return { data: [] }
  }
}

export async function getTechnologiesList(options?: ApiOptions) {
  try {
    return await fetchApi('/technologies', options)
  } catch {
    // Return mock technologies
    return {
      data: [
        { id: "1", type: "technology", attributes: { name: "Salesforce", categories: ["CRM"] } },
        { id: "2", type: "technology", attributes: { name: "HubSpot", categories: ["CRM", "Marketing"] } },
        { id: "3", type: "technology", attributes: { name: "Stripe", categories: ["Finance"] } },
        { id: "4", type: "technology", attributes: { name: "AWS", categories: ["Cloud"] } },
        { id: "5", type: "technology", attributes: { name: "React", categories: ["Development"] } },
        { id: "6", type: "technology", attributes: { name: "Shopify", categories: ["E-commerce"] } },
        { id: "7", type: "technology", attributes: { name: "Slack", categories: ["Communication"] } },
        { id: "8", type: "technology", attributes: { name: "Zoom", categories: ["Communication"] } },
      ],
      meta: { total: 8 }
    }
  }
}

// ==================== NEWS EVENTS ====================

export async function getNewsEvents(domain: string, options?: ApiOptions) {
  try {
    return await fetchApi(`/companies/${encodeURIComponent(domain)}/news_events`, options)
  } catch {
    return { data: [] }
  }
}

// ==================== SIMILAR COMPANIES ====================

export async function getSimilarCompanies(domain: string, options?: ApiOptions) {
  try {
    return await fetchApi(`/companies/${encodeURIComponent(domain)}/similar_companies`, options)
  } catch {
    return { data: [] }
  }
}

// ==================== FILTER OPTIONS ====================

export const FILTER_OPTIONS = {
  technologies: [
    "Salesforce", "HubSpot", "Marketo", "Mailchimp", "Pipedrive", "Zoho CRM",
    "Google Analytics", "Mixpanel", "Amplitude", "Segment",
    "AWS", "Google Cloud", "Microsoft Azure", "Cloudflare", "Vercel", "Netlify",
    "Slack", "Microsoft Teams", "Zoom", "Twilio", "SendGrid",
    "Stripe", "PayPal", "QuickBooks", "Xero", "Chargebee", "Plaid",
    "Workday", "Greenhouse", "Lever", "BambooHR", "Gusto", "Rippling",
    "Notion", "Asana", "Monday", "Trello", "ClickUp", "Linear", "Jira",
    "Okta", "Auth0", "Datadog", "Snyk", "CrowdStrike", "1Password",
    "Outreach", "Salesloft", "Gong", "Apollo", "ZoomInfo", "Clearbit",
    "Zendesk", "Intercom", "Freshdesk", "Drift", "Front",
    "Snowflake", "Databricks", "BigQuery", "PostgreSQL", "MongoDB", "Redis",
    "React", "Next.js", "Vue.js", "Angular", "Node.js", "Python", "Go", "Ruby on Rails",
    "Shopify", "WooCommerce", "Magento", "BigCommerce",
  ],
  locations: [
    "United States", "Canada", "United Kingdom", "Germany", "France", 
    "Netherlands", "Australia", "Singapore", "India", "Remote"
  ],
  companySizes: [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-1000", label: "201-1000 employees" },
    { value: "1000+", label: "1000+ employees" },
  ],
  industries: [
    "Software Development",
    "Financial Services",
    "Healthcare",
    "E-commerce",
    "Marketing & Advertising",
    "Education",
    "Real Estate",
    "Manufacturing",
    "Consulting",
    "Media & Entertainment",
  ]
}

// Export the client
export const apiClient = {
  getCompany,
  searchCompanies,
  getJobOpenings,
  getTechnologyDetections,
  getTechnologiesList,
  getNewsEvents,
  getSimilarCompanies,
  FILTER_OPTIONS,
}
