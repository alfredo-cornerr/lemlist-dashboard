"use client"

import { useState } from "react"
import { Search, Filter, Building2, TrendingUp, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const techCategories = [
  { id: "crm", name: "CRM", count: 12500 },
  { id: "marketing", name: "Marketing Automation", count: 8900 },
  { id: "analytics", name: "Analytics", count: 15600 },
  { id: "infrastructure", name: "Cloud Infrastructure", count: 23400 },
  { id: "communication", name: "Communication", count: 11200 },
  { id: "finance", name: "Finance & Billing", count: 7800 },
]

const mockTechDetections = [
  {
    id: "1",
    technology: "Salesforce",
    category: "CRM",
    company: "HubSpot",
    domain: "hubspot.com",
    firstSeen: "2020-01-15",
    lastSeen: "2024-03-07",
    confidence: 0.98,
  },
  {
    id: "2",
    technology: "AWS",
    category: "Cloud Infrastructure",
    company: "Vercel",
    domain: "vercel.com",
    firstSeen: "2019-06-20",
    lastSeen: "2024-03-07",
    confidence: 0.99,
  },
]

export default function TechnologiesPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Technologies</h1>
            <p className="text-sm text-muted-foreground mt-1">
              980M+ technology detections across 46,000+ SaaS products
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search technologies (e.g., Salesforce, HubSpot)..."
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
        <div className="grid grid-cols-3 gap-4 mb-8">
          {techCategories.map((cat) => (
            <div key={cat.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <h3 className="font-medium">{cat.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{cat.count.toLocaleString()} detections</p>
            </div>
          ))}
        </div>

        {/* Recent Detections */}
        <h2 className="text-lg font-semibold mb-4">Recent Detections</h2>
        <div className="space-y-4">
          {mockTechDetections.map((detection) => (
            <div key={detection.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{detection.technology}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {detection.company}
                      <Badge variant="secondary">{detection.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>First seen: {detection.firstSeen}</span>
                      <span>Last seen: {detection.lastSeen}</span>
                      <span>Confidence: {Math.round(detection.confidence * 100)}%</span>
                    </div>
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
