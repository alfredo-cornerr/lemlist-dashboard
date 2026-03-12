import { NextResponse } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function GET() {
  return NextResponse.json({
    url: SUPABASE_URL,
    urlHasHttps: SUPABASE_URL.startsWith('https://'),
    urlLength: SUPABASE_URL.length,
    keyLength: SUPABASE_ANON_KEY.length,
    timestamp: new Date().toISOString()
  })
}
