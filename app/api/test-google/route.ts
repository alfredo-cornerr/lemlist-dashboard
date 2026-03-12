import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await fetch("https://www.google.com", { method: "HEAD" })
    return NextResponse.json({
      googleReachable: res.ok,
      status: res.status,
    })
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Unknown error",
      googleReachable: false,
    })
  }
}
