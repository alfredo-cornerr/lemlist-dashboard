"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  RefreshCw, Mail, Eye, MessageCircle, AlertCircle, 
  Send, Activity, Clock, TrendingUp, Users, Settings,
  X, BarChart3, PieChart as PieChartIcon
} from "lucide-react"
import { getToken } from "@/lib/auth-client"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface CampaignWithStats {
  campaign_id: string
  campaign_name: string
  campaign_status: string
  total_leads: number
  emails_sent: number
  emails_opened: number
  emails_replied: number
  open_rate: number
  reply_rate: number
  last_synced: string
}

// CORRECT status colors - each status has unique color
const STATUS_COLORS: Record<string, string> = {
  running: '#10b981',   // Green
  paused: '#f59e0b',    // Yellow/Orange
  ended: '#ef4444',     // Red
  draft: '#6b7280',     // Gray
  stopped: '#8b5cf6'    // Purple
}

const STATUS_LABELS: Record<string, string> = {
  running: 'Running',
  paused: 'Paused', 
  ended: 'Ended',
  draft: 'Draft',
  stopped: 'Stopped'
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      const token = getToken()
      
      if (!token) {
        setIsLoading(false)
        return
      }
      
      const response = await fetch("/api/cached/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch")
      }

      setCampaigns(data.campaigns || [])
      setLastSynced(data.lastSynced)
      
      // Auto-select all on first load
      if (selectedCampaigns.length === 0 && data.campaigns?.length > 0) {
        setSelectedCampaigns(data.campaigns.map((c: CampaignWithStats) => c.campaign_id))
      }
    } catch (err) {
      console.error("Error:", err)
      toast.error("Failed to load campaigns")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Sync data from Lemlist
  const syncNow = async () => {
    try {
      setIsSyncing(true)
      const token = getToken()
      
      if (!token) {
        toast.error("Not authenticated")
        return
      }
      
      toast.info("Syncing data from Lemlist... This may take a minute.")
      
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Sync failed")
      }
      
      toast.success(`Sync complete! ${data.campaigns} campaigns, ${data.leads} leads synced.`)
      
      // Refresh campaigns
      await fetchCampaigns()
      
    } catch (err) {
      console.error("Sync error:", err)
      toast.error(err instanceof Error ? err.message : "Sync failed")
    } finally {
      setIsSyncing(false)
    }
  }

  // Filter by user selection
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => selectedCampaigns.includes(c.campaign_id))
  }, [campaigns, selectedCampaigns])

  // Calculate totals
  const totals = useMemo(() => {
    return filteredCampaigns.reduce((acc, c) => ({
      totalLeads: acc.totalLeads + (c.total_leads || 0),
      sent: acc.sent + (c.emails_sent || 0),
      opened: acc.opened + (c.emails_opened || 0),
      replied: acc.replied + (c.emails_replied || 0),
    }), { totalLeads: 0, sent: 0, opened: 0, replied: 0 })
  }, [filteredCampaigns])

  // Status distribution data with CORRECT colors
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredCampaigns.forEach(c => {
      const status = c.campaign_status || 'unknown'
      counts[status] = (counts[status] || 0) + 1
    })
    
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      fill: STATUS_COLORS[status] || '#9ca3af'
    }))
  }, [filteredCampaigns])

  // Performance data
  const performanceData = useMemo(() => {
    return filteredCampaigns
      .filter(c => c.emails_sent > 0)
      .slice(0, 8)
      .map(c => ({
        name: c.campaign_name.length > 12 ? c.campaign_name.substring(0, 12) + "..." : c.campaign_name,
        sent: c.emails_sent,
        opened: c.emails_opened,
        replied: c.emails_replied,
      }))
  }, [filteredCampaigns])

  const toggleCampaign = (id: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              className={showSettings ? 'bg-slate-100' : ''}
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
          </div>
          <p className="text-muted-foreground mt-1">
            {filteredCampaigns.length} of {campaigns.length} campaigns selected
            {lastSynced && (
              <span className="ml-2 text-sm">
                • Synced: {new Date(lastSynced).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={syncNow}
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCampaigns}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="bg-slate-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Select Campaigns to Display</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedCampaigns(campaigns.map(c => c.campaign_id))}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedCampaigns([])}>
                Clear
              </Button>
            </div>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-white space-y-2">
              {campaigns.map((campaign) => (
                <div key={campaign.campaign_id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={campaign.campaign_id}
                    checked={selectedCampaigns.includes(campaign.campaign_id)}
                    onCheckedChange={() => toggleCampaign(campaign.campaign_id)}
                  />
                  <label htmlFor={campaign.campaign_id} className="text-sm flex-1 cursor-pointer">
                    {campaign.campaign_name}
                  </label>
                  <Badge 
                    className="text-xs"
                    style={{ 
                      backgroundColor: STATUS_COLORS[campaign.campaign_status] + '20',
                      color: STATUS_COLORS[campaign.campaign_status],
                      borderColor: STATUS_COLORS[campaign.campaign_status]
                    }}
                    variant="outline"
                  >
                    {campaign.campaign_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In selected campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.sent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totals.totalLeads > 0 ? Math.round((totals.sent / totals.totalLeads) * 100) : 0}% of leads
            </p>
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
              {totals.sent > 0 ? Math.round((totals.opened / totals.sent) * 100) : 0}% open rate
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
              {totals.sent > 0 ? Math.round((totals.replied / totals.sent) * 100) : 0}% reply rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance by Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sent" name="Sent" fill="#3b82f6" />
                    <Bar dataKey="opened" name="Opened" fill="#10b981" />
                    <Bar dataKey="replied" name="Replied" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Campaign Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaigns</CardTitle>
            <Button variant="outline" asChild>
              <Link href="/campaigns">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p>No campaigns selected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.campaign_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{campaign.campaign_name}</span>
                      <Badge 
                        className="text-xs"
                        style={{ 
                          backgroundColor: STATUS_COLORS[campaign.campaign_status] + '20',
                          color: STATUS_COLORS[campaign.campaign_status],
                          borderColor: STATUS_COLORS[campaign.campaign_status]
                        }}
                        variant="outline"
                      >
                        {campaign.campaign_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.total_leads?.toLocaleString()} leads
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{campaign.emails_sent || 0}</p>
                      <p className="text-xs text-muted-foreground">sent</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{campaign.emails_opened || 0}</p>
                      <p className="text-xs text-muted-foreground">opens</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{campaign.emails_replied || 0}</p>
                      <p className="text-xs text-muted-foreground">replies</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
