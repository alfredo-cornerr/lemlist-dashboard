"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { 
  RefreshCw, Mail, Eye, MessageCircle, 
  ArrowLeft, Search, Clock
} from "lucide-react"
import { getToken } from "@/lib/auth-client"

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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "running" | "paused" | "ended">("all")

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      const token = getToken()
      
      if (!token) {
        setIsLoading(false)
        return
      }
      
      // Use cached API
      const response = await fetch("/api/cached/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch")
      }

      setCampaigns(data.campaigns || [])
      setFilteredCampaigns(data.campaigns || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    let filtered = campaigns
    
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.campaign_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.campaign_status === statusFilter)
    }
    
    setFilteredCampaigns(filtered)
  }, [searchQuery, statusFilter, campaigns])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "paused": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "ended": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              {filteredCampaigns.length} of {campaigns.length} campaigns
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchCampaigns}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="running">Running</option>
          <option value="paused">Paused</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No campaigns found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.campaign_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{campaign.campaign_name}</span>
                      <Badge className={getStatusColor(campaign.campaign_status)}>
                        {campaign.campaign_status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{campaign.total_leads?.toLocaleString()} total leads</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Synced: {new Date(campaign.last_synced).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Mail className="h-3 w-3" />
                        <span>Sent</span>
                      </div>
                      <p className="font-semibold text-lg">{campaign.emails_sent || 0}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Eye className="h-3 w-3" />
                        <span>Opens</span>
                      </div>
                      <p className="font-semibold text-lg">{campaign.emails_opened || 0}</p>
                      <p className="text-xs text-green-600">{campaign.open_rate}%</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>Replies</span>
                      </div>
                      <p className="font-semibold text-lg">{campaign.emails_replied || 0}</p>
                      <p className="text-xs text-green-600">{campaign.reply_rate}%</p>
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
