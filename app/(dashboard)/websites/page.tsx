"use client"

import { useState } from "react"
import { Search, Filter, Globe, FileText, Layout, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const pageTypes = [
  { id: "blog", name: "Blog", count: 2340000 },
  { id: "careers", name: "Careers", count: 1890000 },
  { id: "pricing", name: "Pricing", count: 1560000 },
  { id: "about", name: "About", count: 2100000 },
  { id: "contact", name: "Contact", count: 1980000 },
  { id: "product", name: "Product", count: 1450000 },
]

const mockWebsiteChanges = [
  {
    id: "1",
    company: "Stripe",
    domain: "stripe.com",
    pageType: "pricing",
    changeType: "Updated",
    description: "Pricing page updated with new enterprise tier",
    detectedAt: "2024-03-06",
  },
  {
    id: "2",
    company: "Notion",
    domain: "notion.so",
    pageType: "blog",
    changeType: "New Post",
    description: "Announcing Notion AI for Enterprise",
    detectedAt: "2024-03-05",
  },
  {
    id: "3",
    company: "HubSpot",
    domain: "hubspot.com",
    pageType: "careers",
    changeType: "New Jobs",
    description: "Added 15 new positions in Engineering",
    detectedAt: "2024-03-04",
  },
]

const changeTypeColors: Record<string, string> = {
  Updated: "bg-blue-100 text-blue-700",
  "New Post": "bg-green-100 text-green-700",
  "New Jobs": "bg-purple-100 text-purple-700",
  "New Page": "bg-orange-100 text-orange-700",
}

export default function WebsitesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Website Intel</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Website structure, content changes, and page analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search website changes..."
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
        {/* Page Types */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {pageTypes.map((type) => (
            <div key={type.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <Layout className="h-5 w-5 text-muted-foreground mb-2" />
              <h3 className="font-medium">{type.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{type.count.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Recent Changes */}
        <h2 className="text-lg font-semibold mb-4">Recent Website Changes</h2>
        <div className="space-y-4">
          {mockWebsiteChanges.map((change) => (
            <div key={change.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {change.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{change.company}</span>
                    <Badge variant="secondary">{change.domain}</Badge>
                    <Badge className={changeTypeColors[change.changeType]}>{change.changeType}</Badge>
                  </div>
                  <h3 className="font-medium">{change.description}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {change.pageType}
                    </span>
                    <span>Detected: {change.detectedAt}</span>
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
