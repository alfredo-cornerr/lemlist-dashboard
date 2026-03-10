import { NextRequest, NextResponse } from "next/server"
import { exportsStore } from "@/lib/exports/store"

// GET /api/exports/download - Download export as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exportId = searchParams.get("id")

    if (!exportId) {
      return NextResponse.json(
        { error: "Export ID required" },
        { status: 400 }
      )
    }

    const exportRecord = exportsStore.find(e => e.id === exportId)
    
    if (!exportRecord) {
      return NextResponse.json(
        { error: "Export not found" },
        { status: 404 }
      )
    }

    // Generate CSV with all fields
    const headers = ["Domain", "Company Name", "Location", "Industry", "Size", "Description"]
    const rows = exportRecord.companies.map((c: any) => [
      c.domain,
      c.name || "",
      c.location || "",
      c.industry || "",
      c.employee_count || "",
      c.description || "",
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row: string[]) => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="cornect-export-${exportId}.csv"`,
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      { error: "Failed to download export" },
      { status: 500 }
    )
  }
}
