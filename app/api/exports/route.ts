import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { exportsStore } from "@/lib/exports/store"

// Predict Leads API credentials
const AUTH_KEY = process.env.PREDICT_LEADS_AUTH_KEY || 'ne4ohcsqwz8rxyyz16ba'
const AUTH_TOKEN = process.env.PREDICT_LEADS_AUTH_TOKEN || 'zE7etFBaW3gTkDovV_Ub'
const BASE_URL = 'https://api.predictleads.com/v3'

// Fetch company from Predict Leads API
async function fetchCompany(domain: string) {
  const url = `${BASE_URL}/companies/${encodeURIComponent(domain)}`
  
  console.log(`[Exports API] Fetching: ${url}`)
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'X-User-Key': AUTH_KEY,
      'X-User-Token': AUTH_TOKEN,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  return response.json()
}

// GET /api/exports - List user's exports
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ data: exportsStore })
  } catch (error) {
    console.error("List exports error:", error)
    return NextResponse.json(
      { error: "Failed to fetch exports" },
      { status: 500 }
    )
  }
}

// POST /api/exports - Create new export
const createExportSchema = z.object({
  domains: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domains } = createExportSchema.parse(body)

    console.log("[Exports API] Export requested for domains:", domains)

    // Fetch real company data from Predict Leads API
    const companies = await Promise.all(
      domains.map(async (domain: string) => {
        try {
          const data = await fetchCompany(domain)
          
          return {
            domain,
            name: data.data?.attributes?.company_name || domain,
            location: data.data?.attributes?.location || "Unknown",
            description: data.data?.attributes?.description || "",
            employee_count: data.data?.attributes?.employee_count || "Unknown",
            industry: data.data?.attributes?.industry || "Unknown",
            success: true,
          }
        } catch (error) {
          console.error(`[Exports API] Failed to fetch ${domain}:`, error)
          return {
            domain,
            name: domain,
            location: "Unknown",
            description: "",
            employee_count: "Unknown",
            industry: "Unknown",
            success: false,
          }
        }
      })
    )

    const successful = companies.filter((c: any) => c.success)
    const failed = companies.filter((c: any) => !c.success)

    console.log(`[Exports API] Complete: ${successful.length} successful, ${failed.length} failed`)

    // Create export record
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const exportId = `exp_${Date.now()}`
    const exportRecord = {
      id: exportId,
      userId: "user-id",
      domains,
      companies: successful.map((c: any) => ({
        domain: c.domain,
        name: c.name,
        location: c.location,
        description: c.description,
        employee_count: c.employee_count,
        industry: c.industry,
      })),
      creditsUsed: successful.length,
      totalDomains: domains.length,
      successful: successful.length,
      failed: failed.length,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      downloadUrl: `/api/exports/download?id=${exportId}`,
    }

    exportsStore.push(exportRecord)
    
    console.log("[Exports API] Export record created:", exportRecord.id)

    return NextResponse.json({
      data: {
        export: exportRecord,
        successful: successful.length,
        failed: failed.length,
        companies: successful,
      },
    })
  } catch (error) {
    console.error("Create export error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create export" },
      { status: 500 }
    )
  }
}
