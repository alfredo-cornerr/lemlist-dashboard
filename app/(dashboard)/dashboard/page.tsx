"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  RefreshCw, 
  Mail, 
  Eye, 
  MousePointer, 
  MessageCircle, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Send,
  Key,
  Plus,
  BarChart3,
  PieChart,
  Activity,
  Filter
} from "lucide-react"
import { supabaseBrowserClient } from "@/lib/supabase-client"
import { toast } from "sonner"
import type { Campaign, CampaignStats } from "@/lib/lemlist"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface CampaignWithStats extends Campaign {
  stats?: CampaignStats
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6']

export default function DashboardPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [chartType, setChartType] = useState<"bar" | "pie" | "line">("bar")
  const [metricFilter, setMetricFilter] = useState<"all" | "opens" | "clicks" | "replies">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "running" | "paused" | "stopped">("all")

  const fetchCampaigns = async () => {
    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession()
      
      if (!session) {
        setHasApiKey(false)
        setIsLoading(false)
        return
      }
      
      const response = await fetch("/api/lemlist/campaigns", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      
      const data = await response.json()

      if (!response.ok) {
        if (data.error?.includes("API key not configured")) {
          setHasApiKey(false)
          setIsLoading(false)
          return
        }
        throw new Error(data.error || "Failed to fetch campaigns")
      }

      setHasApiKey(true)

      // Fetch stats for each campaign
      const campaignsWithStats = await Promise.all(
        (data.campaigns || []).map(async (campaign: Campaign) => {
          try {
            const statsResponse = await fetch(`/api/lemlist/campaigns/${campaign._id}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            const statsData = await statsResponse.json()
            return { ...campaign, stats: statsData.stats }
          } catch {
            return campaign
          }
        })
      )

      setCampaigns(campaignsWithStats)
      setLastSynced(new Date())
    } catch (err) {
      console.error("Error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to load campaigns")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchCampaigns()
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => statusFilter === "all" || c.status === statusFilter)
  }, [campaigns, statusFilter])

  // Calculate totals
  const totals = useMemo(() => {
    return filteredCampaigns.reduce(
      (acc, campaign) => ({
        sent: acc.sent + (campaign.stats?.sent || 0),
        opened: acc.opened + (campaign.stats?.opened || 0),
        clicked: acc.clicked + (campaign.stats?.clicked || 0),
        replied: acc.replied + (campaign.stats?.replied || 0),
        bounced: acc.bounced + (campaign.stats?.bounced || 0),
      }),
      { sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 }
    )
  }, [filteredCampaigns])

  // Chart data
  const chartData = useMemo(() => {
    return filteredCampaigns.map((c, i) => ({
      name: c.name.length > 20 ? c.name.substring(0, 20) + "..." : c.name,
      fullName: c.name,
      sent: c.stats?.sent || 0,
      opened: c.stats?.opened || 0,
      clicked: c.stats?.clicked || 0,
      replied: c.stats?.replied || 0,
      bounced: c.stats?.bounced || 0,
      openRate: c.stats?.sent ? Math.round((c.stats.opened / c.stats.sent) * 100) : 0,
      clickRate: c.stats?.sent ? Math.round((c.stats.clicked / c.stats.sent) * 100) : 0,
      replyRate: c.stats?.sent ? Math.round((c.stats.replied / c.stats.sent) * 100) : 0,
      color: COLORS[i % COLORS.length],
      status: c.status,
    }))
  }, [filteredCampaigns])

  // Pie chart data for metrics
  const pieData = useMemo(() => {
    if (metricFilter === "all") {
      return [
        { name: "Opened", value: totals.opened, color: COLORS[0] },
        { name: "Clicked", value: totals.clicked, color: COLORS[1] },
        { name: "Replied", value: totals.replied, color: COLORS[2] },
        { name: "Bounced", value: totals.bounced, color: COLORS[3] },
      ].filter(d => d.value > 0)
    }
    const getValue = (c: typeof chartData[0]) => {
      switch (metricFilter) {
        case "opens": return c.opened
        case "clicks": return c.clicked
        case "replies": return c.replied
        default: return c.opened
      }
    }
    return chartData.map((c, i) => ({
      name: c.name,
      value: getValue(c),
      color: COLORS[i % COLORS.length],
    })).filter(d => d.value > 0)
  }, [totals, chartData, metricFilter])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Loading your campaigns...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (hasApiKey === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center border-0 shadow-lg">
          <CardHeader>
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">Connect Lemlist</CardTitle>
            <CardDescription>Link your Lemlist account to see your campaigns and stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600" onClick={() => router.push("/onboarding")}>
              <Plus className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/settings")}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-100 text-green-800"
      case "paused": return "bg-yellow-100 text-yellow-800"
      case "stopped": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your Lemlist campaigns</p>
        </div>
        <div className="flex items-center gap-4">
          {lastSynced && <p className="text-sm text-muted-foreground">Last synced: {lastSynced.toLocaleTimeString()}</p>}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.sent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{filteredCampaigns.length} campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Opens</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.opened.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totals.sent > 0 ? `${Math.round((totals.opened / totals.sent) * 100)}% rate` : "No data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.clicked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totals.sent > 0 ? `${Math.round((totals.clicked / totals.sent) * 100)}% rate` : "No data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Replies</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.replied.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totals.sent > 0 ? `${Math.round((totals.replied / totals.sent) * 100)}% rate` : "No data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bounces</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.bounced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totals.sent > 0 ? `${Math.round((totals.bounced / totals.sent) * 100)}% rate` : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Analytics
              </CardTitle>
              <CardDescription>Visualize your campaign performance</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
              <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Chart Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                </SelectContent>
              </Select>
              {chartType === "pie" && (
                <Select value={metricFilter} onValueChange={(v: any) => setMetricFilter(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Metrics</SelectItem>
                    <SelectItem value="opens">Opens</SelectItem>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="replies">Replies</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No campaign data available
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" && (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg">
                              <p className="font-semibold">{data.fullName}</p>
                              <p className="text-sm text-muted-foreground">Status: {data.status}</p>
                              <div className="mt-2 space-y-1 text-sm">
                                <p>Sent: {data.sent.toLocaleString()}</p>
                                <p>Opened: {data.opened.toLocaleString()} ({data.openRate}%)</p>
                                <p>Clicked: {data.clicked.toLocaleString()} ({data.clickRate}%)</p>
                                <p>Replied: {data.replied.toLocaleString()} ({data.replyRate}%)</p>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Bar dataKey="sent" name="Sent" fill="#6366f1" />
                    <Bar dataKey="opened" name="Opened" fill="#22c55e" />
                    <Bar dataKey="clicked" name="Clicked" fill="#f97316" />
                    <Bar dataKey="replied" name="Replied" fill="#ec4899" />
                  </BarChart>
                )}
                {chartType === "pie" && (
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => (value as number).toLocaleString()} />
                    <Legend />
                  </RePieChart>
                )}
                {chartType === "line" && (
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="openRate" name="Open Rate %" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="clickRate" name="Click Rate %" stroke="#f97316" strokeWidth={2} />
                    <Line type="monotone" dataKey="replyRate" name="Reply Rate %" stroke="#ec4899" strokeWidth={2} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Campaigns</CardTitle>
              <CardDescription>{filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""} found</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/campaigns">View all <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-muted-foreground mb-4">Create your first campaign in Lemlist to see it here.</p>
              <Button variant="outline" asChild>
                <a href="https://app.lemlist.com" target="_blank" rel="noopener noreferrer">Open Lemlist</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.slice(0, 5).map((campaign) => (
                <Link
                  key={campaign._id}
                  href={`/campaigns/${campaign._id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{campaign.name}</span>
                      <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{campaign.stats?.sent || 0}</p>
                      <p className="text-xs text-muted-foreground">sent</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{campaign.stats?.opened || 0}</p>
                      <p className="text-xs text-muted-foreground">opens</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{campaign.stats?.replied || 0}</p>
                      <p className="text-xs text-muted-foreground">replies</p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
