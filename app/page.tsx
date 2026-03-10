import { redirect } from "next/navigation"
import { getCurrentUser, getUserLemlistApiKey } from "@/lib/supabase-server"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const apiKey = await getUserLemlistApiKey(user.id)

  if (!apiKey) {
    redirect("/onboarding")
  }

  redirect("/dashboard")
}
