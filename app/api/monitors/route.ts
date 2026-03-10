import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Mock data for build/demo
const mockMonitors: any[] = [
  {
    id: "1",
    name: "Stripe Competitors",
    targetType: "FILTER_SET",
    targetConfig: { filters: [{ technology: "payments" }] },
    signals: ["NEWS_EVENTS", "JOB_OPENINGS"],
    frequency: "DAILY",
    isActive: true,
    creditsPerRun: 2,
    totalHits: 234,
    lastRunAt: new Date().toISOString(),
    nextRunAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// GET /api/monitors - List user's monitors
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ data: mockMonitors })
  } catch (error) {
    console.error("List monitors error:", error)
    return NextResponse.json(
      { error: "Failed to fetch monitors" },
      { status: 500 }
    )
  }
}

// POST /api/monitors - Create new monitor
const createMonitorSchema = z.object({
  name: z.string().min(1),
  targetType: z.enum(["SINGLE_COMPANY", "FILTER_SET"]),
  targetConfig: z.object({
    domain: z.string().optional(),
    filters: z.array(z.any()).optional(),
  }),
  signals: z.array(z.enum(["NEWS_EVENTS", "JOB_OPENINGS", "TECH_CHANGES", "WEBSITE_CHANGES", "CONNECTIONS"])),
  frequency: z.enum(["HOURLY", "DAILY", "WEEKLY"]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createMonitorSchema.parse(body)

    const newMonitor = {
      id: String(mockMonitors.length + 1),
      ...data,
      targetConfig: data.targetConfig as any,
      isActive: true,
      creditsPerRun: data.signals.length,
      totalHits: 0,
      lastRunAt: new Date().toISOString(),
      nextRunAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockMonitors.push(newMonitor)

    return NextResponse.json({ data: newMonitor }, { status: 201 })
  } catch (error) {
    console.error("Create monitor error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create monitor" },
      { status: 500 }
    )
  }
}
