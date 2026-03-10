"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { 
  RefreshCw, 
  Mail, 
  Eye, 
  MousePointer, 
  MessageCircle, 
  AlertCircle,
  ArrowLeft,
  Search,
  Key,
  Plus
} from "lucide-react"
import { supabaseBrowserClient } from "@/lib/supabase-client"
import type { Campaign, CampaignStats } from "@/lib/lemlist"

interface CampaignWithStats extends Campaign {
  stats?: CampaignStats
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchCampaigns = async () => {
    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession()
      
      const response = await fetch("/api/lemlist/campaigns", {
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      })
      
      const data = await response.json()

      if (!response.ok) {
        // Check if it's an API key issue
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
        data.campaigns.map(async (campaign: Campaign) => {
          try {
            const statsResponse = await fetch(`/api/lemlist/campaigns/${campaign._id}`, {
              headers: {
                Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
              },
            })
            const statsData = await statsResponse.json()
            return {
              ...campaign,
              stats: statsData.stats,
            }
          } catch {
            return campaign
          }
        })
      )

      setCampaigns(campaignsWithStats)
      setFilteredCampaigns(campaignsWithStats)
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      // Don't show toast - let the UI handle it gracefully
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

  useEffect(() => {
    if (searchQuery) {
      const filtered = campaigns.filter((campaign) =>
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCampaigns(filtered)
    } else {
      setFilteredCampaigns(campaigns)
    }
  }, [searchQuery, campaigns])

  // If no API key configured, show onboarding prompt
  if (hasApiKey === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center border-0 shadow-lg">
          <CardHeader>
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">Connect Lemlist</CardTitle>
            <CardDescription className="text-base">
              Link your Lemlist account to see your campaigns and stats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
              onClick={() => router.push("/onboarding")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push("/settings")}
            >
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "stopped":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800"
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
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all your Lemlist campaigns
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>
            {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No campaigns found" : "No campaigns yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create your first campaign in Lemlist to see it here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <Link
                  key={campaign._id}
                  href={`/campaigns/${campaign._id}`}
                  className="block p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{campaign.name}</span>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground pl-7">
                        Created {new Date(campaign.createdAt).toLocaleDateString()} • 
                        Updated {new Date(campaign.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Mail className="h-3 w-3" />
                          <span>Sent</span>
                        </div>
                        <p className="font-semibold text-lg">{campaign.stats?.sent || 0}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Eye className="h-3 w-3" />
                          <span>Opens</span>
                        </div>
                        <p className="font-semibold text-lg">{campaign.stats?.opened || 0}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <MousePointer className="h-3 w-3" />
                          <span>Clicks</span>
                        </div>
                        <p className="font-semibold text-lg">{campaign.stats?.clicked || 0}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>Replies</span>
                        </div>
                        <p className="font-semibold text-lg">{campaign.stats?.replied || 0}</p>
                      </div>
                    </div>
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
