"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserPlus, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { supabaseBrowserClient } from "@/lib/supabase-client"

interface Stats {
  totalUsers: number
  activeUsers: number
  todaySignups: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabaseBrowserClient.auth.getSession()
        
        const response = await fetch("/api/admin/stats", {
          headers: {
            Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
          },
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch stats")
        }
        
        const data = await response.json()
        setStats(data)
      } catch (error) {
        toast.error("Failed to fetch stats")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your Lemlist Portal users
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (with API Key)</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
                <span className="text-sm text-muted-foreground">
                  ({stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats?.todaySignups || 0}</div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Manage your portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • <strong>Users</strong> - View all registered users and their API key status
            </p>
            <p className="text-sm text-muted-foreground">
              • <strong>Activity</strong> - Monitor user actions and system events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Make an Admin</CardTitle>
            <CardDescription>Grant admin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To make a user an admin, run this SQL in Supabase:
            </p>
            <code className="block mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs">
              UPDATE profiles SET is_admin = TRUE WHERE id = &apos;user-uuid-here&apos;;
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
