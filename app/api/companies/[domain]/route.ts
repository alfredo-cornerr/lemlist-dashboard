import { NextRequest, NextResponse } from "next/server"
import {
  getCompany,
  getSimilarCompanies,
  getJobOpenings,
  getTechnologyDetections,
  getNewsEvents,
} from "@/lib/predict-leads"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const { domain: encodedDomain } = await params
    const domain = decodeURIComponent(encodedDomain)
    const { searchParams } = new URL(request.url)
    
    // Check what data to include
    const includeSimilar = searchParams.get("similar") === "true"
    const includeJobs = searchParams.get("jobs") === "true"
    const includeTech = searchParams.get("tech") === "true"
    const includeNews = searchParams.get("news") === "true"

    // Get base company data
    const company = await getCompany(domain)
    
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      )
    }

    const result: any = { company }

    // Fetch additional data if requested
    if (includeSimilar) {
      try {
        const similar = await getSimilarCompanies(domain)
        result.similarCompanies = similar.companies
      } catch {
        result.similarCompanies = []
      }
    }

    if (includeJobs) {
      try {
        const jobs = await getJobOpenings(domain)
        result.jobOpenings = jobs.jobs
      } catch {
        result.jobOpenings = []
      }
    }

    if (includeTech) {
      try {
        const tech = await getTechnologyDetections(domain)
        result.technologies = tech.technologies
      } catch {
        result.technologies = []
      }
    }

    if (includeNews) {
      try {
        const news = await getNewsEvents(domain)
        result.newsEvents = news.events
      } catch {
        result.newsEvents = []
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Company fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch company data" },
      { status: 500 }
    )
  }
}
