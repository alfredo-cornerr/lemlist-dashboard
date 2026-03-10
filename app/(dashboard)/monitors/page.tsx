"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Plus,
  Bell,
  Calendar,
  Clock,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  TrendingUp,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Mock monitors data
const mockMonitors = [
  {
    id: "1",
    name: "Stripe Competitors",
    targetType: "FILTER_SET" as const,
    targetConfig: { filters: [{ technology: "payments", location: "US" }] },
    signals: ["NEWS_EVENTS", "JOB_OPENINGS"],
    frequency: "DAILY",
    isActive: true,
    creditsPerRun: 50,
    totalHits: 234,
    lastRunAt: "2024-03-07T10:00:00Z",
    nextRunAt: "2024-03-08T10:00:00Z",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "2",
    name: "Notion Watch",
    targetType: "SINGLE_COMPANY" as const,
    targetConfig: { domain: "notion.so" },
    signals: ["NEWS_EVENTS", "TECH_CHANGES", "JOB_OPENINGS"],
    frequency: "HOURLY",
    isActive: true,
    creditsPerRun: 3,
    totalHits: 89,
    lastRunAt: "2024-03-07T14:30:00Z",
    nextRunAt: "2024-03-07T15:30:00Z",
    createdAt: "2024-02-01T12:00:00Z",
  },
  {
    id: "3",
    name: "Y Combinator Startups",
    targetType: "FILTER_SET" as const,
    targetConfig: { filters: [{ signal: "funding", category: "startup" }] },
    signals: ["NEWS_EVENTS"],
    frequency: "WEEKLY",
    isActive: false,
    creditsPerRun: 120,
    totalHits: 45,
    lastRunAt: "2024-03-01T09:00:00Z",
    nextRunAt: null,
    createdAt: "2024-01-20T15:30:00Z",
  },
]

const signalIcons: Record<string, React.ReactNode> = {
  NEWS_EVENTS: <Activity className="h-3.5 w-3.5" />,
  JOB_OPENINGS: <TrendingUp className="h-3.5 w-3.5" />,
  TECH_CHANGES: <Bell className="h-3.5 w-3.5" />,
  WEBSITE_CHANGES: <Bell className="h-3.5 w-3.5" />,
  CONNECTIONS: <Bell className="h-3.5 w-3.5" />,
}

const signalLabels: Record<string, string> = {
  NEWS_EVENTS: "News",
  JOB_OPENINGS: "Jobs",
  TECH_CHANGES: "Tech",
  WEBSITE_CHANGES: "Web",
  CONNECTIONS: "Connections",
}

const frequencyLabels: Record<string, string> = {
  HOURLY: "Every hour",
  DAILY: "Daily",
  WEEKLY: "Weekly",
}

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState(mockMonitors)

  const toggleMonitor = (id: string) => {
    setMonitors((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, isActive: !m.isActive } : m
      )
    )
  }

  const deleteMonitor = (id: string) => {
    setMonitors((prev) => prev.filter((m) => m.id !== id))
  }

  const activeMonitors = monitors.filter((m) => m.isActive).length
  const totalHits = monitors.reduce((sum, m) => sum + m.totalHits, 0)
  const monthlyCost = monitors
    .filter((m) => m.isActive)
    .reduce((sum, m) => {
      const dailyMultiplier = m.frequency === "HOURLY" ? 24 : m.frequency === "DAILY" ? 1 : 1 / 7
      return sum + m.creditsPerRun * dailyMultiplier * 30
    }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Signal Monitors</h1>
          <p className="text-muted-foreground mt-1">
            Set up automated monitoring for companies and get notified of changes
          </p>
        </div>
        <Link href="/monitors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Monitor
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Monitors</p>
                <p className="text-3xl font-bold mt-1">{activeMonitors}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Signals</p>
                <p className="text-3xl font-bold mt-1">{totalHits.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Est. Monthly Cost</p>
                <p className="text-3xl font-bold mt-1">{Math.round(monthlyCost).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">credits/month</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitors List */}
      <div className="space-y-4">
        {monitors.map((monitor, index) => (
          <motion.div
            key={monitor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "border-border/50 transition-colors",
                !monitor.isActive && "opacity-60"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{monitor.name}</h3>
                      <Badge
                        variant={monitor.isActive ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {monitor.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {monitor.targetType === "SINGLE_COMPANY" ? (
                          <>
                            <span className="font-medium text-foreground">
                              {monitor.targetConfig.domain}
                            </span>
                            <span>• Single company</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-foreground">
                              Filter set
                            </span>
                            <span>• Multiple companies</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {frequencyLabels[monitor.frequency]}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span>{monitor.creditsPerRun} credits/run</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {monitor.signals.map((signal) => (
                        <Badge
                          key={signal}
                          variant="purple"
                          className="gap-1 text-xs"
                        >
                          {signalIcons[signal]}
                          {signalLabels[signal]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold">{monitor.totalHits}</div>
                      <div className="text-xs text-muted-foreground">signals caught</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleMonitor(monitor.id)}
                    >
                      {monitor.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMonitor(monitor.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {monitor.lastRunAt && (
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                    <span>Last run: {new Date(monitor.lastRunAt).toLocaleString()}</span>
                    {monitor.nextRunAt && monitor.isActive && (
                      <span>Next run: {new Date(monitor.nextRunAt).toLocaleString()}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {monitors.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No monitors yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                Create your first monitor to start tracking companies and get notified of important changes
              </p>
              <Link href="/monitors/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Monitor
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
