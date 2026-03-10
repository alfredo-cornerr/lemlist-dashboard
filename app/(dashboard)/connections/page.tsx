"use client"

import { useState } from "react"
import { Search, Filter, Building2, GitBranch, Handshake, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const connectionTypes = [
  { id: "client", name: "Client", description: "Customer relationships" },
  { id: "partner", name: "Partner", description: "Strategic partnerships" },
  { id: "integration", name: "Integration", description: "Technology integrations" },
  { id: "competitor", name: "Competitor", description: "Competitive relationships" },
  { id: "investor", name: "Investor", description: "Investment relationships" },
]

const mockConnections = [
  {
    id: "1",
    company1: { name: "Salesforce", domain: "salesforce.com" },
    company2: { name: "Slack", domain: "slack.com" },
    type: "integration",
    description: "Slack integrates with Salesforce CRM for team collaboration",
    firstSeen: "2019-01-15",
    lastSeen: "2024-03-07",
  },
  {
    id: "2",
    company1: { name: "Stripe", domain: "stripe.com" },
    company2: { name: "Shopify", domain: "shopify.com" },
    type: "partner",
    description: "Shopify uses Stripe as primary payment processor",
    firstSeen: "2015-06-20",
    lastSeen: "2024-03-07",
  },
  {
    id: "3",
    company1: { name: "HubSpot", domain: "hubspot.com" },
    company2: { name: "Salesforce", domain: "salesforce.com" },
    type: "competitor",
    description: "Competing in CRM and marketing automation space",
    firstSeen: "2018-03-10",
    lastSeen: "2024-03-07",
  },
]

const typeColors: Record<string, string> = {
  client: "bg-blue-100 text-blue-700",
  partner: "bg-green-100 text-green-700",
  integration: "bg-purple-100 text-purple-700",
  competitor: "bg-red-100 text-red-700",
  investor: "bg-yellow-100 text-yellow-700",
}

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Connections</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Company relationships, partnerships, and integrations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies, relationships..."
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
        {/* Connection Types */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {connectionTypes.map((type) => (
            <div key={type.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <GitBranch className="h-5 w-5 text-muted-foreground mb-2" />
              <h3 className="font-medium">{type.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
            </div>
          ))}
        </div>

        {/* Connections List */}
        <h2 className="text-lg font-semibold mb-4">Recent Connections</h2>
        <div className="space-y-4">
          {mockConnections.map((conn) => (
            <div key={conn.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {conn.company1.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{conn.company1.name}</p>
                    <p className="text-xs text-muted-foreground">{conn.company1.domain}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={typeColors[conn.type]}>
                    <Handshake className="h-3 w-3 mr-1" />
                    {conn.type}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-sm font-bold">
                    {conn.company2.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{conn.company2.name}</p>
                    <p className="text-xs text-muted-foreground">{conn.company2.domain}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3 ml-14">{conn.description}</p>

              <div className="flex items-center gap-3 mt-3 ml-14 text-xs text-muted-foreground">
                <span>First seen: {conn.firstSeen}</span>
                <span>Last confirmed: {conn.lastSeen}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
