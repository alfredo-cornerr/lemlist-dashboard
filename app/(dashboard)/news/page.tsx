"use client"

import { useState } from "react"
import { Search, Filter, Building2, Calendar, TrendingUp, Briefcase, Handshake, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const newsCategories = [
  { id: "funding", name: "Funding", icon: TrendingUp, count: 12400 },
  { id: "acquisition", name: "Acquisitions", icon: Building2, count: 5600 },
  { id: "hiring", name: "Executive Hiring", icon: Briefcase, count: 8900 },
  { id: "partnership", name: "Partnerships", icon: Handshake, count: 6700 },
  { id: "award", name: "Awards", icon: Award, count: 3400 },
]

const mockNews = [
  {
    id: "1",
    company: "Stripe",
    domain: "stripe.com",
    category: "funding",
    title: "Stripe raises $6.5B in Series I funding",
    summary: "Stripe announced today that it has raised $6.5 billion in Series I funding at a $50 billion valuation.",
    date: "2024-03-06",
    confidence: 0.98,
    source: "TechCrunch",
  },
  {
    id: "2",
    company: "Salesforce",
    domain: "salesforce.com",
    category: "acquisition",
    title: "Salesforce acquires AI startup Airkit.ai",
    summary: "Salesforce has acquired Airkit.ai, a startup building AI-powered customer service agents.",
    date: "2024-03-05",
    confidence: 0.95,
    source: "Reuters",
  },
  {
    id: "3",
    company: "HubSpot",
    domain: "hubspot.com",
    category: "hiring",
    title: "HubSpot hires new Chief Revenue Officer",
    summary: "HubSpot announced the appointment of John Smith as Chief Revenue Officer, effective immediately.",
    date: "2024-03-04",
    confidence: 0.99,
    source: "Business Wire",
  },
]

const categoryColors: Record<string, string> = {
  funding: "bg-green-100 text-green-700",
  acquisition: "bg-blue-100 text-blue-700",
  hiring: "bg-purple-100 text-purple-700",
  partnership: "bg-orange-100 text-orange-700",
  award: "bg-yellow-100 text-yellow-700",
}

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">News Events</h1>
            <p className="text-sm text-muted-foreground mt-1">
              8M+ curated news signals from 19M+ sources
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search news, companies, events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Button variant="outline" className="h-10 gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Categories */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {newsCategories.map((cat) => {
            const Icon = cat.icon
            return (
              <div key={cat.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <Icon className="h-5 w-5 text-muted-foreground mb-2" />
                <h3 className="font-medium">{cat.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{cat.count.toLocaleString()}</p>
              </div>
            )
          })}
        </div>

        {/* News Feed */}
        <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
        <div className="space-y-4">
          {mockNews.map((news) => (
            <div key={news.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {news.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{news.company}</span>
                    <Badge className={categoryColors[news.category]}>
                      {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(news.confidence * 100)}% confidence
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{news.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{news.summary}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {news.date}
                    </span>
                    <span>Source: {news.source}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
