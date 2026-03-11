import { NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "@/lib/supabase-config"

export async function GET() {
  try {
    // Test using direct fetch (works on Vercel)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    })
    
    const data = await res.json()
    
    return NextResponse.json({
      url: SUPABASE_URL,
      status: res.status,
      connected: res.ok,
      data: data,
    })
  } catch (e) {
    return NextResponse.json({
      url: SUPABASE_URL,
      error: e instanceof Error ? e.message : "Unknown error"
    })
  }
}
