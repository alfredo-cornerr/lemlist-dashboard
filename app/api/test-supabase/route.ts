import { NextResponse } from "next/server"
import { SUPABASE_URL } from "@/lib/supabase-config"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwaGdjcGtqcHNyZHJkb2pnandhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxOTYwMjgsImV4cCI6MjA1NDc3MjAyOH0.EiaRi5E1-tUj9JY54yJ4L-NNfQmLlaFGeF4jU7hL9xM")
    
    const { data, error } = await supabase.from("profiles").select("count").single()
    
    return NextResponse.json({
      url: SUPABASE_URL,
      urlLength: SUPABASE_URL.length,
      urlEndsWith: SUPABASE_URL.slice(-10),
      connected: !error,
      error: error?.message || null
    })
  } catch (e) {
    return NextResponse.json({
      url: SUPABASE_URL,
      error: e instanceof Error ? e.message : "Unknown error"
    })
  }
}
