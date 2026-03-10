"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  RefreshCw, 
  Mail, 
  Eye, 
  MousePointer, 
  MessageCircle, 
  AlertCircle,
  ArrowLeft,
  Send,
  Users,
  ListTodo,
  User,
  Clock,
  Key,
  Plus
} from "lucide-react"
import { supabaseBrowserClient } from "@/lib/supabase-client"
import type { Campaign, CampaignStats, Lead, SequenceStep } from "@/lib/lemlist"

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [sequence, setSequence] = useState<SequenceStep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchCampaignData = async () => {
    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession()
      
      const response = await fetch(`/api/lemlist/campaigns/${campaignId}`, {
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
        throw new Error(data.error || "Failed to fetch campaign")
      }

      setHasApiKey(true)
      setCampaign(data.campaign)
      setStats(data.stats)
      setLeads(data.leads)
      setSequence(data.sequence)
    } catch (error) {
      console.error("Error fetching campaign:", error)
      // Don't show toast - let the UI handle it gracefully
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchCampaignData()
  }

  useEffect(() => {
    fetchCampaignData()
  }, [campaignId])

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
              Link your Lemlist account to see campaign details
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

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case "contacted":
        return "bg-blue-100 text-blue-800"
      case "replied":
        return "bg-green-100 text-green-800"
      case "bounced":
        return "bg-red-100 text-red-800"
      case "unsubscribed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "linkedin":
        return <Users className="h-4 w-4" />
      case "call":
        return <MessageCircle className="h-4 w-4" />
      default:
        return <ListTodo className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!campaign && hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Campaign not found</h3>
        <p className="text-muted-foreground mb-4">
          The campaign you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Button asChild>
          <Link href="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to campaigns
          </Link>
        </Button>
      </div>
    )
  }

  if (!campaign) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Created {new Date(campaign.createdAt).toLocaleDateString()} • 
              Updated {new Date(campaign.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sent || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opens</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.opened || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.sent ? `${Math.round((stats.opened / stats.sent) * 100)}% rate` : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clicked || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.sent ? `${Math.round((stats.clicked / stats.sent) * 100)}% rate` : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replies</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.replied || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.sent ? `${Math.round((stats.replied / stats.sent) * 100)}% rate` : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounces</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bounced || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.sent ? `${Math.round((stats.bounced / stats.sent) * 100)}% rate` : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unsubscribed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.sent ? `${Math.round((stats.unsubscribed / stats.sent) * 100)}% rate` : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">
            <Users className="h-4 w-4 mr-2" />
            Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="sequence">
            <ListTodo className="h-4 w-4 mr-2" />
            Sequence ({sequence.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Leads</CardTitle>
              <CardDescription>
                All leads in this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No leads in this campaign yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leads.map((lead) => (
                    <div
                      key={lead._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {lead.firstName || lead.lastName 
                              ? `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
                              : lead.email}
                          </p>
                          {(lead.firstName || lead.lastName) && (
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {lead.lastActivityAt && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(lead.lastActivityAt).toLocaleDateString()}
                          </div>
                        )}
                        <Badge className={getLeadStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequence">
          <Card>
            <CardHeader>
              <CardTitle>Sequence Steps</CardTitle>
              <CardDescription>
                Overview of your campaign sequence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sequence.length === 0 ? (
                <div className="text-center py-8">
                  <ListTodo className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No sequence steps configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sequence.map((step, index) => (
                    <div
                      key={step._id}
                      className="flex items-center gap-4 p-3 border rounded-lg"
                    >
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStepTypeIcon(step.type)}
                          <span className="font-medium">{step.name}</span>
                          <Badge variant="outline">{step.type}</Badge>
                        </div>
                      </div>
                      {step.delay > 0 && (
                        <div className="text-sm text-muted-foreground">
                          +{step.delay} days
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
