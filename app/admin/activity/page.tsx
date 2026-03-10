"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Clock, User } from "lucide-react"
import { toast } from "sonner"
import { supabaseBrowserClient } from "@/lib/supabase-client"

interface ActivityLog {
  id: string
  user_id: string
  user_email?: string
  action: string
  details: Record<string, unknown>
  created_at: string
}

export default function AdminActivityPage() {
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data: { session } } = await supabaseBrowserClient.auth.getSession()
        
        const response = await fetch("/api/admin/activity", {
          headers: {
            Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
          },
        })
        
        const data = await response.json()
        setActivity(data.activity)
      } catch (error) {
        toast.error("Failed to fetch activity")
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivity()
  }, [])

  const getActionColor = (action: string) => {
    if (action.includes("login")) return "bg-blue-100 text-blue-800"
    if (action.includes("signup")) return "bg-green-100 text-green-800"
    if (action.includes("api_key")) return "bg-purple-100 text-purple-800"
    if (action.includes("campaign")) return "bg-orange-100 text-orange-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">
          Recent user actions across the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({activity.length})</CardTitle>
          <CardDescription>
            Last 100 actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user_email || log.user_id.substring(0, 8)}
                      </span>
                    </div>
                    {Object.keys(log.details).length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
