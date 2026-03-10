"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowserClient } from "@/lib/supabase-client"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabaseBrowserClient.auth.exchangeCodeForSession(window.location.search)
      
      if (error) {
        console.error("Auth callback error:", error)
        router.push("/auth/login?error=callback")
        return
      }

      router.push("/dashboard")
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
