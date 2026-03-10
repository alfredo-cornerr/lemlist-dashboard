import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase-server"
import { Navigation } from "@/components/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Note: We don't redirect to onboarding here anymore
  // Let the individual pages handle missing API keys gracefully

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="h-[calc(100vh-3.5rem)] overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
