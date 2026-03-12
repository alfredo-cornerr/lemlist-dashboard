// Pure HTTP client for Supabase - works everywhere including Vercel
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "./supabase-config"

const headers = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

export const supabaseApi = {
  async rpc(functionName: string, params: any) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new Error(`RPC error: ${res.status}`)
    return { data: await res.json(), error: null }
  },
  
  async from(table: string) {
    return {
      async select(columns: string = '*') {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, { headers })
        if (!res.ok) throw new Error(`Select error: ${res.status}`)
        return { data: await res.json(), error: null }
      },
      async insert(data: any) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error(`Insert error: ${res.status}`)
        return { data: await res.json(), error: null }
      },
    }
  }
}
