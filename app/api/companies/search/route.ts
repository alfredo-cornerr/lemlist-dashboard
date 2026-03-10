import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const searchSchema = z.object({
  query: z.string().optional(),
  technology: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(20),
})

// Predict Leads API credentials
const AUTH_KEY = process.env.PREDICT_LEADS_AUTH_KEY || 'ne4ohcsqwz8rxyyz16ba'
const AUTH_TOKEN = process.env.PREDICT_LEADS_AUTH_TOKEN || 'zE7etFBaW3gTkDovV_Ub'
const BASE_URL = 'https://api.predictleads.com/v3'

// Fetch from Predict Leads API with both key and token
async function fetchPredictLeads(endpoint: string, options: { page?: number; perPage?: number } = {}) {
  const params = new URLSearchParams()
  if (options.page) params.set('page', String(options.page))
  if (options.perPage) params.set('per_page', String(options.perPage))
  
  const query = params.toString() ? `?${params.toString()}` : ''
  const url = `${BASE_URL}${endpoint}${query}`
  
  console.log(`[Server API] Calling: ${url}`)
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'X-User-Key': AUTH_KEY,        // API Key
      'X-User-Token': AUTH_TOKEN,    // API Token
    },
  })
  
  console.log(`[Server API] Response status: ${response.status}`)
  
  if (!response.ok) {
    const error = await response.text()
    console.error(`[Server API] Error: ${response.status} - ${error}`)
    throw new Error(`API Error: ${response.status} - ${error}`)
  }
  
  return response.json()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = searchSchema.parse({
      query: searchParams.get("query") || undefined,
      technology: searchParams.get("technology") || undefined,
      location: searchParams.get("location") || undefined,
      industry: searchParams.get("industry") || undefined,
      company_size: searchParams.get("company_size") || undefined,
      page: searchParams.get("page") || "1",
      perPage: searchParams.get("perPage") || "20",
    })

    console.log('[Server API] Search params:', params)

    // Try the REAL Predict Leads API first
    try {
      const query = new URLSearchParams()
      if (params.technology) query.set('technology', params.technology)
      if (params.location) query.set('location', params.location)
      if (params.industry) query.set('industry', params.industry)
      if (params.company_size) query.set('company_size', params.company_size)
      query.set('page', String(params.page))
      query.set('per_page', String(params.perPage))
      
      const result = await fetchPredictLeads(`/companies?${query.toString()}`)
      
      console.log(`[Server API] Got ${result.data?.length || 0} companies from API`)
      
      return NextResponse.json({
        data: result.data || [],
        meta: {
          total: result.meta?.total || result.data?.length || 0,
          page: params.page,
          perPage: params.perPage,
          totalPages: Math.ceil((result.meta?.total || result.data?.length || 0) / params.perPage),
        },
      })
    } catch (apiError) {
      console.error('[Server API] Predict Leads API failed:', apiError)
      
      // If API fails, return error - NO MORE FALLBACK TO MOCK DATA
      return NextResponse.json(
        { 
          error: "Predict Leads API unavailable", 
          details: apiError instanceof Error ? apiError.message : String(apiError)
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("Search error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to search companies" },
      { status: 500 }
    )
  }
}
