import { redirect } from "next/navigation"
import { getCurrentUserWithProfile } from "@/lib/supabase-server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Activity, ArrowLeft, Shield } from "lucide-react"

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/activity", label: "Activity", icon: Activity },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userWithProfile = await getCurrentUserWithProfile()

  if (!userWithProfile?.user) {
    redirect("/auth/login")
  }

  if (!userWithProfile.isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Admin Header */}
      <header className="bg-white dark:bg-slate-900 border-b">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg">Admin Portal</h1>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
