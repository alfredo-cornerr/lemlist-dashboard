"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Radio,
  Bell,
  TrendingUp,
  Briefcase,
  Activity,
  ArrowUpRight,
  Clock,
  Play,
  Pause,
  Trash2,
  Filter,
  Calendar,
  Building2,
  CheckCircle,
  AlertCircle,
  Zap,
  RefreshCw,
  ExternalLink,
  X,
  Search,
  Download,
  Settings,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ALL_NEWS_CATEGORIES, SAAS_TECHNOLOGIES } from "@/lib/predict-leads-types"

// Signal type definitions
const SIGNAL_TYPES = [
  { id: "news", label: "News Events", icon: Bell, color: "bg-blue-500", count: 234 },
  { id: "jobs", label: "Job Openings", icon: Briefcase, color: "bg-green-500", count: 567 },
  { id: "tech", label: "Tech Changes", icon: Activity, color: "bg-purple-500", count: 89 },
  { id: "web", label: "Website Changes", icon: ArrowUpRight, color: "bg-orange-500", count: 45 },
]

// Mock monitors
const MOCK_MONITORS = [
  {
    id: "mon_1",
    name: "Stripe & Payment Competitors",
    type: "companies",
    targets: ["stripe.com", "square.com", "adyen.com", "checkout.com"],
    signals: ["news", "jobs", "tech"],
    frequency: "daily",
    isActive: true,
    lastRun: "2024-03-07T14:30:00Z",
    nextRun: "2024-03-08T14:30:00Z",
    totalHits: 145,
    creditsPerDay: 12,
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "mon_2",
    name: "AI Companies - Funding",
    type: "filter",
    filterQuery: "industry:AI signal:funding",
    signals: ["news"],
    frequency: "hourly",
    isActive: true,
    lastRun: "2024-03-07T15:00:00Z",
    nextRun: "2024-03-07T16:00:00Z",
    totalHits: 23,
    creditsPerDay: 24,
    createdAt: "2024-02-01T12:00:00Z",
  },
  {
    id: "mon_3",
    name: "SaaS Companies - Hiring Spree",
    type: "filter",
    filterQuery: "industry:SaaS job_count:>20",
    signals: ["jobs"],
    frequency: "daily",
    isActive: false,
    lastRun: "2024-03-04T09:00:00Z",
    nextRun: null,
    totalHits: 89,
    creditsPerDay: 1,
    createdAt: "2024-01-20T15:30:00Z",
  },
]

// Mock signal hits with timestamps
const MOCK_SIGNAL_HITS = [
  {
    id: "hit_1",
    monitorId: "mon_1",
    monitorName: "Stripe & Payment Competitors",
    company: { name: "Stripe", domain: "stripe.com" },
    signalType: "news",
    category: "product_launch",
    title: "Stripe announces new AI-powered fraud detection",
    summary: "Stripe unveiled a new AI-powered fraud detection system that reduces false positives by 40%.",
    detectedAt: "2024-03-07T14:30:00Z",
    confidence: 0.95,
    source: "TechCrunch",
    url: "https://techcrunch.com/2024/03/07/stripe-ai-fraud",
  },
  {
    id: "hit_2",
    monitorId: "mon_1",
    monitorName: "Stripe & Payment Competitors",
    company: { name: "Square", domain: "square.com" },
    signalType: "jobs",
    category: "engineering",
    title: "Hiring 15 Senior Engineers in San Francisco",
    summary: "Square posted 15 new senior engineering roles including Backend, Frontend, and DevOps positions.",
    detectedAt: "2024-03-07T13:15:00Z",
    confidence: 1.0,
    source: "Square Careers",
    url: "https://careers.square.com",
  },
  {
    id: "hit_3",
    monitorId: "mon_2",
    monitorName: "AI Companies - Funding",
    company: { name: "Anthropic", domain: "anthropic.com" },
    signalType: "news",
    category: "receives_financing",
    title: "Raised $750M Series D led by Spark Capital",
    summary: "Anthropic announced a $750M Series D funding round, bringing total funding to $2.7B.",
    detectedAt: "2024-03-07T12:00:00Z",
    confidence: 0.98,
    source: "Reuters",
    url: "https://reuters.com/anthropic-funding",
  },
  {
    id: "hit_4",
    monitorId: "mon_1",
    monitorName: "Stripe & Payment Competitors",
    company: { name: "Adyen", domain: "adyen.com" },
    signalType: "tech",
    category: "tech_adoption",
    title: "Added Snowflake to data stack",
    summary: "Adyen detected using Snowflake data warehouse alongside existing AWS infrastructure.",
    detectedAt: "2024-03-07T10:45:00Z",
    confidence: 0.92,
    source: "BuiltWith",
    url: null,
  },
  {
    id: "hit_5",
    monitorId: "mon_2",
    monitorName: "AI Companies - Funding",
    company: { name: "Cohere", domain: "cohere.com" },
    signalType: "news",
    category: "partners_with",
    title: "Partnership with Oracle announced",
    summary: "Cohere and Oracle announced a strategic partnership to integrate Cohere's LLM into Oracle Cloud.",
    detectedAt: "2024-03-07T09:30:00Z",
    confidence: 0.96,
    source: "Business Wire",
    url: "https://businesswire.com/cohere-oracle",
  },
  {
    id: "hit_6",
    monitorId: "mon_1",
    monitorName: "Stripe & Payment Competitors",
    company: { name: "Checkout.com", domain: "checkout.com" },
    signalType: "jobs",
    category: "sales",
    title: "Hiring VP of Sales EMEA",
    summary: "Checkout.com posted a VP of Sales position for the EMEA region.",
    detectedAt: "2024-03-07T08:15:00Z",
    confidence: 1.0,
    source: "LinkedIn",
    url: "https://linkedin.com/jobs",
  },
  {
    id: "hit_7",
    monitorId: "mon_3",
    monitorName: "SaaS Companies - Hiring Spree",
    company: { name: "Notion", domain: "notion.so" },
    signalType: "jobs",
    category: "product_management",
    title: "Hiring 5 Product Managers",
    summary: "Notion is expanding its product team with 5 new PM roles focused on AI features.",
    detectedAt: "2024-03-06T18:00:00Z",
    confidence: 1.0,
    source: "Notion Careers",
    url: "https://notion.so/careers",
  },
  {
    id: "hit_8",
    monitorId: "mon_2",
    monitorName: "AI Companies - Funding",
    company: { name: "Perplexity", domain: "perplexity.ai" },
    signalType: "news",
    category: "launches",
    title: "Launched Enterprise API",
    summary: "Perplexity launched a new Enterprise API for businesses to integrate AI search.",
    detectedAt: "2024-03-06T16:30:00Z",
    confidence: 0.94,
    source: "TechCrunch",
    url: "https://techcrunch.com/perplexity-api",
  },
]

const FREQUENCY_LABELS: Record<string, string> = {
  hourly: "Every hour",
  daily: "Daily",
  weekly: "Weekly",
}

const CATEGORY_LABELS: Record<string, string> = {
  product_launch: "Product Launch",
  receives_financing: "Funding",
  engineering: "Engineering Hire",
  sales: "Sales Hire",
  tech_adoption: "Tech Stack",
  partnership: "Partnership",
  product_management: "Product Hire",
  launches: "Launch",
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function SignalsPage() {
  const [activeTab, setActiveTab] = useState("feed")
  const [monitors, setMonitors] = useState(MOCK_MONITORS)
  const [signalHits, setSignalHits] = useState(MOCK_SIGNAL_HITS)
  const [selectedSignals, setSelectedSignals] = useState<string[]>(["news", "jobs", "tech", "web"])
  const [quickAddDomain, setQuickAddDomain] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const refreshFeed = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const activeMonitors = monitors.filter((m) => m.isActive)
  const totalCreditsPerDay = activeMonitors.reduce((sum, m) => sum + m.creditsPerDay, 0)
  const totalHits = signalHits.length

  const filteredHits = signalHits.filter((hit) =>
    selectedSignals.includes(hit.signalType)
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Radio className="h-6 w-6 text-primary" />
              Signals
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor companies and get real-time alerts on important changes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={refreshFeed} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Link href="/signals/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Monitor
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-border px-6">
            <TabsList className="h-12 bg-transparent border-0">
              <TabsTrigger value="feed" className="data-[state=active]:bg-muted">
                <Bell className="h-4 w-4 mr-2" />
                Live Feed
                {totalHits > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {totalHits}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="monitors" className="data-[state=active]:bg-muted">
                <Zap className="h-4 w-4 mr-2" />
                Monitors
                {monitors.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {monitors.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="quick" className="data-[state=active]:bg-muted">
                <Building2 className="h-4 w-4 mr-2" />
                Quick Monitor
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Live Feed Tab */}
          <TabsContent value="feed" className="flex-1 m-0 p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {SIGNAL_TYPES.map((type) => {
                const Icon = type.icon
                const count = signalHits.filter((h) => h.signalType === type.id).length
                return (
                  <Card
                    key={type.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedSignals.includes(type.id) ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"
                    )}
                    onClick={() => {
                      setSelectedSignals((prev) =>
                        prev.includes(type.id)
                          ? prev.filter((s) => s !== type.id)
                          : [...prev, type.id]
                      )
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{type.label}</p>
                          <p className="text-2xl font-bold mt-1">{count}</p>
                        </div>
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", type.color)}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Signal Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Showing:</span>
              {SIGNAL_TYPES.map((type) => (
                <Badge
                  key={type.id}
                  variant={selectedSignals.includes(type.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedSignals((prev) =>
                      prev.includes(type.id)
                        ? prev.filter((s) => s !== type.id)
                        : [...prev, type.id]
                    )
                  }}
                >
                  {type.label}
                </Badge>
              ))}
            </div>

            {/* Signal Feed */}
            <div className="space-y-4">
              <AnimatePresence>
                {filteredHits.map((hit, index) => {
                  const signalType = SIGNAL_TYPES.find((s) => s.id === hit.signalType)
                  const SignalIcon = signalType?.icon || Bell

                  return (
                    <motion.div
                      key={hit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", signalType?.color)}>
                              <SignalIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold">{hit.company.name}</span>
                                    <span className="text-sm text-muted-foreground">{hit.company.domain}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {hit.monitorName}
                                    </Badge>
                                    <Badge className={cn("text-xs", signalType?.color.replace("bg-", "bg-opacity-10 text-"))}>
                                      {CATEGORY_LABELS[hit.category] || hit.category}
                                    </Badge>
                                  </div>
                                  <h3 className="font-medium mt-1">{hit.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">{hit.summary}</p>
                                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTimeAgo(hit.detectedAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      {Math.round(hit.confidence * 100)}% confidence
                                    </span>
                                    <span>Source: {hit.source}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {hit.url && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                            <a href={hit.url} target="_blank" rel="noopener noreferrer">
                                              <ExternalLink className="h-4 w-4" />
                                            </a>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View source</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {filteredHits.length === 0 && (
                <div className="text-center py-12">
                  <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No signals yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Create a monitor to start receiving signals
                  </p>
                  <Link href="/signals/new">
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Monitor
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Monitors Tab */}
          <TabsContent value="monitors" className="m-0 p-6">
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Monitors</p>
                        <p className="text-3xl font-bold mt-1">{activeMonitors.length}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Signals</p>
                        <p className="text-3xl font-bold mt-1">{totalHits}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Daily Cost</p>
                        <p className="text-3xl font-bold mt-1">{totalCreditsPerDay}</p>
                        <p className="text-xs text-muted-foreground">credits/day</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monitors List */}
              <div className="space-y-4">
                {monitors.map((monitor) => (
                  <Card key={monitor.id} className={cn(!monitor.isActive && "opacity-60")}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              monitor.isActive ? "bg-green-100" : "bg-gray-100"
                            )}
                          >
                            <Radio
                              className={cn(
                                "h-5 w-5",
                                monitor.isActive ? "text-green-600" : "text-gray-500"
                              )}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">{monitor.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              {monitor.type === "companies" ? (
                                <>
                                  <Building2 className="h-3.5 w-3.5" />
                                  {monitor.targets?.length || 0} companies
                                </>
                              ) : (
                                <>
                                  <Filter className="h-3.5 w-3.5" />
                                  Filter: {monitor.filterQuery}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              {monitor.signals.map((signal) => (
                                <Badge key={signal} variant="secondary" className="text-xs">
                                  {SIGNAL_TYPES.find((s) => s.id === signal)?.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {FREQUENCY_LABELS[monitor.frequency]}
                            </div>
                            <div className="text-sm mt-1">
                              <span className="font-medium">{monitor.creditsPerDay}</span> credits/day
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-sm">
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              <span>{monitor.totalHits} hits</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
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
                              className="text-destructive"
                              onClick={() => deleteMonitor(monitor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {monitor.lastRun && (
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                          <span>Last run: {formatTimeAgo(monitor.lastRun)}</span>
                          {monitor.nextRun && monitor.isActive && (
                            <span>Next: {formatTimeAgo(monitor.nextRun)}</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {monitors.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No monitors yet</h3>
                      <p className="text-muted-foreground mt-1">
                        Create your first monitor to start tracking companies
                      </p>
                      <Link href="/signals/new">
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
          </TabsContent>

          {/* Quick Monitor Tab */}
          <TabsContent value="quick" className="m-0 p-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Quick Monitor</CardTitle>
                <CardDescription>
                  Paste a domain to quickly start monitoring a company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Domain</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., stripe.com"
                      value={quickAddDomain}
                      onChange={(e) => setQuickAddDomain(e.target.value)}
                    />
                    <Button disabled={!quickAddDomain}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Signals to Track</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SIGNAL_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <label
                          key={type.id}
                          className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        >
                          <div className={cn("w-8 h-8 rounded flex items-center justify-center", type.color)}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-muted-foreground">1 credit per check</p>
                          </div>
                          <input type="checkbox" defaultChecked className="h-4 w-4" />
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated cost</span>
                    <span className="font-medium">4 credits/day</span>
                  </div>
                  <Button className="w-full mt-4">
                    <Zap className="h-4 w-4 mr-2" />
                    Start Monitoring
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
