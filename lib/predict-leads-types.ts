// Predict Leads API Types - Based on documentation

// ==================== COMPANIES ====================

export interface Company {
  id: string
  type: "company"
  attributes: {
    domain: string
    company_name: string | null
    ticker: string | null
    friendly_company_name: string
    meta_title: string
    meta_description: string
    description: string | null
    description_short: string | null
    language: string
    location: string | null
    location_data: LocationData[]
  }
  relationships: {
    redirects_to?: { data: { id: string; type: "company" } | null; meta?: { reason: string | null } }
    parent_company?: { data: { id: string; type: "company" } | null }
    subsidiary_companies?: { data: { id: string; type: "company" }[] }
    lookalike_companies?: { data: { id: string; type: "company" }[] }
  }
}

export interface LocationData {
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  region: string | null
  continent: string | null
  fuzzy_match: boolean | null
}

// ==================== JOB OPENINGS ====================

export interface JobOpening {
  id: string
  type: "job_opening"
  attributes: {
    title: string
    description: string | null
    url: string
    first_seen_at: string
    last_seen_at: string
    last_processed_at: string
    contract_types: string[]
    categories: JobCategory[]
    onet_data: {
      code: string | null
      family: string | null
      occupation_name: string | null
    }
    posted_at: string | null
    recruiter_data: {
      name: string | null
      title: string | null
      contact: string | null
    }
    salary: string | null
    salary_data: {
      salary_low: number | null
      salary_high: number | null
      salary_currency: string | null
      salary_low_usd: number | null
      salary_high_usd: number | null
      salary_time_unit: string | null
    }
    seniority: Seniority | null
    status: "closed" | null
    language: string | null
    location: string | null
    location_data: LocationData[]
    tags: string[]
  }
}

export type JobCategory = 
  | "administration" | "consulting" | "data_analysis" | "design" | "directors"
  | "education" | "engineering" | "finance" | "healthcare_services" | "human_resources"
  | "information_technology" | "internship" | "legal" | "management" | "marketing"
  | "military_and_protective_services" | "operations" | "purchasing" | "product_management"
  | "quality_assurance" | "real_estate" | "research" | "sales" | "software_development"
  | "support" | "manual_work" | "food"

export type Seniority =
  | "not_set" | "founder" | "c_level" | "partner" | "president" | "vice_president"
  | "head" | "director" | "manager" | "mid_senior" | "junior" | "non_manager"

// ==================== TECHNOLOGY DETECTIONS ====================

export interface TechnologyDetection {
  id: string
  type: "technology_detection"
  attributes: {
    first_seen_at: string
    last_seen_at: string
    behind_firewall: boolean
    score: number
  }
  relationships: {
    company: { data: { id: string; type: "company" } }
    technology: { data: { id: string; type: "technology" } }
    seen_on_job_openings?: { data: { id: string; type: "job_opening" }[] }
    seen_on_subpages?: { data: { id: string; type: "detection_on_subpage" }[] }
    seen_on_dns_records?: { data: { id: string; type: "dns_record" }[] }
    seen_on_connection?: { data: { id: string; type: "connection" } }
  }
}

export interface Technology {
  id: string
  type: "technology"
  attributes: {
    name: string
    description: string | null
    categories: string[]
    parent_categories: ParentCategory[]
    domain: string | null
    url: string | null
    pricing_data: {
      min_usd: number | null
      max_usd: number | null
      average_spend: number | null
      interval: string | null
      tags: PricingTag[]
    }
    created_at: string
  }
}

export type ParentCategory =
  | "Accounting and Finance" | "Advertising" | "Audio, Video, Graphics"
  | "Communication and Collaboration" | "Customer Service" | "Data Management"
  | "DevOps" | "E-Commerce" | "Human Resources" | "Intelligence and Analytics"
  | "IT Infrastructure" | "Marketing" | "Operations" | "Programming"
  | "Sales" | "Security" | "Software Development" | "Web Tools and Plugins"
  | "Hardware" | "Certificates"

export type PricingTag =
  | "poa" | "b2b" | "enterprise" | "free" | "freemium" | "high" | "low" | "mid"
  | "onetime" | "payg" | "recurring" | "trial" | "b2c"

// ==================== NEWS EVENTS ====================

export interface NewsEvent {
  id: string
  type: "news_event"
  attributes: {
    summary: string
    category: NewsCategory
    found_at: string
    confidence: number
    article_sentence: string
    planning: boolean
    amount: string | null
    amount_normalized: number | null
    assets: string | null
    assets_tags: string[]
    award: string | null
    contact: string | null
    event: string | null
    effective_date: string | null
    division: string | null
    financing_type: string | null
    financing_type_normalized: FinancingType | null
    financing_type_tags: string[]
    headcount: number | null
    job_title: string | null
    job_title_tags: string[]
    location: string | null
    product: string | null
    recognition: string | null
    vulnerability: string | null
  }
}

export type NewsCategory =
  | "acquires" | "merges_with" | "sells_assets_to"
  | "signs_new_client"
  | "files_suit_against" | "has_issues_with"
  | "closes_offices_in" | "decreases_headcount_by"
  | "attends_event" | "expands_facilities" | "expands_offices_in" | "expands_offices_to"
  | "increases_headcount_by" | "opens_new_location"
  | "goes_public" | "invests_into" | "invests_into_assets" | "receives_financing"
  | "hires" | "leaves" | "promotes" | "retires_from"
  | "integrates_with" | "is_developing" | "launches"
  | "partners_with"
  | "receives_award" | "recognized_as"
  | "identified_as_competitor_of"

export type FinancingType =
  | "pre_angel" | "angel" | "pre_seed" | "seed" | "pre_series_a" | "series_a"
  | "pre_series_b" | "series_b" | "pre_series_c" | "series_c" | "pre_series_d"
  | "series_d" | "pre_series_e" | "series_e" | "pre_series_f" | "series_f"
  | "pre_series_g" | "series_g" | "pre_series_h" | "series_h"
  | "pre_series_i" | "series_i" | "pre_series_j" | "series_j"

// ==================== SIMILAR COMPANIES ====================

export interface SimilarCompany {
  id: string
  type: "company_similarity"
  attributes: {
    score: number
    position: number | null
    reason: string | null
    refreshed_at: string
  }
  relationships: {
    company: { data: { id: string; type: "company" } }
    similar_company: { data: { id: string; type: "company" } }
  }
}

// ==================== CONNECTIONS ====================

export interface Connection {
  id: string
  type: "connection"
  attributes: {
    first_seen_at: string
    last_seen_at: string
    source_url: string | null
  }
  relationships: {
    company1: { data: { id: string; type: "company" } }
    company2: { data: { id: string; type: "company" } }
  }
}

// ==================== WEBSITE EVOLUTION ====================

export interface WebsiteEvolution {
  id: string
  type: "website_evolution"
  attributes: {
    url: string
    subpage_type: string
    subpage_category: string
    first_seen_at: string
    last_seen_at: string
    content_text: string | null
    content_markdown: string | null
  }
}

// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  data: T
  included?: any[]
  meta?: {
    schema_version?: string
    record_state?: string
    count?: number
    total?: number
    page?: number
    per_page?: number
    total_pages?: number
  }
}

// ==================== PAGINATION PARAMS ====================

export interface PaginationParams {
  page?: number
  per_page?: number
}

// ==================== FILTER OPTIONS ====================

export const ALL_JOB_CATEGORIES: JobCategory[] = [
  "administration", "consulting", "data_analysis", "design", "directors",
  "education", "engineering", "finance", "healthcare_services", "human_resources",
  "information_technology", "internship", "legal", "management", "marketing",
  "military_and_protective_services", "operations", "purchasing", "product_management",
  "quality_assurance", "real_estate", "research", "sales", "software_development",
  "support", "manual_work", "food"
]

export const ALL_SENIORITY_LEVELS: Seniority[] = [
  "founder", "c_level", "partner", "president", "vice_president",
  "head", "director", "manager", "mid_senior", "junior", "non_manager", "not_set"
]

export const ALL_NEWS_CATEGORIES: NewsCategory[] = [
  "acquires", "merges_with", "sells_assets_to",
  "signs_new_client",
  "files_suit_against", "has_issues_with",
  "closes_offices_in", "decreases_headcount_by",
  "attends_event", "expands_facilities", "expands_offices_in", "expands_offices_to",
  "increases_headcount_by", "opens_new_location",
  "goes_public", "invests_into", "invests_into_assets", "receives_financing",
  "hires", "leaves", "promotes", "retires_from",
  "integrates_with", "is_developing", "launches",
  "partners_with",
  "receives_award", "recognized_as",
  "identified_as_competitor_of"
]

export const CONTRACT_TYPES = [
  "full time", "part time", "contract", "remote", "hybrid", "internship"
]

// SaaS Technology Categories with examples
export const SAAS_TECHNOLOGIES = {
  crm: [
    "Salesforce", "HubSpot CRM", "Pipedrive", "Zoho CRM", "Microsoft Dynamics 365",
    "Freshsales", "Insightly", "Copper", "SugarCRM", "Zendesk Sell"
  ],
  marketing_automation: [
    "Marketo", "HubSpot Marketing", "Mailchimp", "Klaviyo", "ActiveCampaign",
    "Pardot", "Eloqua", "Iterable", "Braze", "Customer.io"
  ],
  analytics: [
    "Google Analytics", "Mixpanel", "Amplitude", "Segment", "Hotjar",
    "Heap", "FullStory", "PostHog", "Chartbeat", "Clicky"
  ],
  infrastructure: [
    "AWS", "Google Cloud", "Microsoft Azure", "Cloudflare", "Fastly",
    "Vercel", "Netlify", "Heroku", "DigitalOcean", "Linode"
  ],
  communication: [
    "Slack", "Microsoft Teams", "Zoom", "Twilio", "SendGrid",
    "Discord", "Webex", "RingCentral", "8x8", "Vonage"
  ],
  finance: [
    "Stripe", "PayPal", "QuickBooks", "Xero", "Chargebee",
    "Recurly", "Zuora", "Brex", "Mercury", "Plaid"
  ],
  hr: [
    "Workday", "Greenhouse", "Lever", "Ashby", "BambooHR",
    "Gusto", "Rippling", "Deel", "Remote", "HiBob"
  ],
  productivity: [
    "Notion", "Asana", "Monday", "Trello", "ClickUp",
    "Linear", "Jira", "Confluence", "Coda", "Airtable"
  ],
  security: [
    "Okta", "OneLogin", "Auth0", "Cloudflare Access", "Datadog",
    "Snyk", "CrowdStrike", "SentinelOne", "KnowBe4", "1Password"
  ],
  sales: [
    "Outreach", "Salesloft", "Gong", "Chorus", "Apollo",
    "ZoomInfo", "Lusha", "Clearbit", "Seamless.AI", "LeadIQ"
  ],
  customer_support: [
    "Zendesk", "Intercom", "Freshdesk", "Help Scout", "Crisp",
    "Tidio", "LiveChat", "Drift", "Crisp", "Front"
  ],
  data: [
    "Snowflake", "Databricks", "BigQuery", "Redshift", "MongoDB",
    "PostgreSQL", "MySQL", "Elasticsearch", "Redis", "Kafka"
  ]
}
