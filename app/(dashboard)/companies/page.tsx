"use client"

import { useState, useMemo } from "react"
import { Search, Download, Filter, X, ChevronDown, Building2, MapPin, Briefcase, Users, MoreHorizontal, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CompanyPreview } from "@/components/company-preview"
import { SAAS_TECHNOLOGIES, ALL_JOB_CATEGORIES } from "@/lib/predict-leads-types"

// Quick filter options
const QUICK_FILTERS = {
  industry: ["Software", "Financial Services", "Healthcare", "E-commerce", "AI/ML"],
  location: ["San Francisco", "New York", "Austin", "Remote"],
  employees: ["1-50", "51-200", "201-1000", "1000+"],
}

// Generate mock data
const generateCompanies = () => {
  const allTechs = Object.values(SAAS_TECHNOLOGIES).flat()
  const locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Boston, MA", "Chicago, IL", "Denver, CO", "Los Angeles, CA"]
  const industries = ["Software", "Financial Services", "Healthcare", "E-commerce", "AI/ML", "Enterprise Software", "Marketing"]
  
  return Array.from({ length: 250 }, (_, i) => {
    const industry = industries[i % industries.length]
    const location = locations[i % locations.length]
    
    return {
      id: `comp_${i}`,
      name: i < 20 ? ["Stripe", "Notion", "Vercel", "Salesforce", "HubSpot", "Shopify", "Twilio", "Snowflake", "Datadog", "Zoom", "Anthropic", "OpenAI", "Figma", "Linear", "Raycast", "Supabase", "Railway", "Vercel", "Stripe", "Notion"][i] : `Company ${i}`,
      domain: i < 20 ? ["stripe.com", "notion.so", "vercel.com", "salesforce.com", "hubspot.com", "shopify.com", "twilio.com", "snowflake.com", "datadoghq.com", "zoom.us", "anthropic.com", "openai.com", "figma.com", "linear.app", "raycast.com", "supabase.com", "railway.app", "vercel.com", "stripe.com", "notion.so"][i] : `company${i}.com`,
      industry,
      location,
      employees: ["1-50", "51-200", "201-1000", "1000+"][i % 4],
      technologies: allTechs.slice(i % 50, (i % 50) + Math.floor(Math.random() * 4) + 2),
      jobCount: Math.floor(Math.random() * 50),
      hasSignal: Math.random() > 0.7,
    }
  })
}

export default function CompaniesPage() {
  const [companies] = useState(() => generateCompanies())
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
  const [previewDomain, setPreviewDomain] = useState<string | null>(null)
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  // Filter companies
  const filteredCompanies = useMemo(() => {
    let result = companies

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.domain.toLowerCase().includes(q)
      )
    }

    // Apply quick filters
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values.length === 0) return
      
      result = result.filter(c => {
        if (key === 'industry') return values.includes(c.industry)
        if (key === 'location') return values.some(v => c.location.includes(v))
        if (key === 'employees') return values.includes(c.employees)
        return true
      })
    })

    return result
  }, [companies, searchQuery, activeFilters])

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[category] || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [category]: updated }
    })
  }

  const toggleCompany = (id: string) => {
    setSelectedCompanies(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedCompanies.size === filteredCompanies.length) {
      setSelectedCompanies(new Set())
    } else {
      setSelectedCompanies(new Set(filteredCompanies.map(c => c.id)))
    }
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchQuery("")
  }

  const activeFilterCount = Object.values(activeFilters).flat().length + (searchQuery ? 1 : 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Companies</h1>
            <p className="text-sm text-muted-foreground">
              Browse 96M+ companies • Showing {filteredCompanies.length} results
            </p>
          </div>
          
          {selectedCompanies.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-lg">
              <span className="font-medium">{selectedCompanies.size} selected</span>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
            )}
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Industry:</span>
            {QUICK_FILTERS.industry.map(ind => {
              const active = activeFilters.industry?.includes(ind)
              return (
                <button
                  key={ind}
                  onClick={() => toggleFilter('industry', ind)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-colors",
                    active 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {ind}
                </button>
              )
            })}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Location:</span>
            {QUICK_FILTERS.location.map(loc => {
              const active = activeFilters.location?.includes(loc)
              return (
                <button
                  key={loc}
                  onClick={() => toggleFilter('location', loc)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm transition-colors",
                    active 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {loc}
                </button>
              )
            })}
          </div>

          <Button variant="ghost" size="sm" onClick={() => setShowMoreFilters(!showMoreFilters)}>
            More filters
            <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform", showMoreFilters && "rotate-180")} />
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {showMoreFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4">
            <div>
              <span className="text-sm font-medium">Company Size</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_FILTERS.employees.map(size => {
                  const active = activeFilters.employees?.includes(size)
                  return (
                    <button
                      key={size}
                      onClick={() => toggleFilter('employees', size)}
                      className={cn(
                        "px-2 py-1 rounded text-xs transition-colors",
                        active 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium">Technology</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Salesforce", "HubSpot", "AWS", "Stripe"].map(tech => (
                  <span key={tech} className="px-2 py-1 rounded text-xs bg-muted">
                    {tech}
                  </span>
                ))}
                <span className="px-2 py-1 rounded text-xs text-muted-foreground">+42 more</span>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium">Job Categories</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Engineering", "Sales", "Marketing"].map(cat => (
                  <span key={cat} className="px-2 py-1 rounded text-xs bg-muted">
                    {cat}
                  </span>
                ))}
                <span className="px-2 py-1 rounded text-xs text-muted-foreground">+24 more</span>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium">Signals</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Hiring
                </span>
                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Funding
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="w-10 py-3 px-4">
                <button onClick={selectAll}>
                  {selectedCompanies.size === filteredCompanies.length && filteredCompanies.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Company</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Location</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Tech Stack</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Size</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Jobs</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCompanies.map((company) => (
              <tr 
                key={company.id} 
                className={cn(
                  "group hover:bg-muted/50 transition-colors cursor-pointer",
                  selectedCompanies.has(company.id) && "bg-primary/5"
                )}
              >
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleCompany(company.id)}>
                    {selectedCompanies.has(company.id) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                </td>
                <td className="py-3 px-4" onClick={() => setPreviewDomain(company.domain)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-xs text-muted-foreground">{company.domain}</div>
                      {company.hasSignal && (
                        <Badge variant="secondary" className="mt-1 text-xs">Has signals</Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4" onClick={() => setPreviewDomain(company.domain)}>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {company.location}
                  </div>
                </td>
                <td className="py-3 px-4" onClick={() => setPreviewDomain(company.domain)}>
                  <div className="flex flex-wrap gap-1">
                    {company.technologies.slice(0, 3).map((tech: string) => (
                      <span key={tech} className="tech-badge">
                        {tech}
                      </span>
                    ))}
                    {company.technologies.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{company.technologies.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4" onClick={() => setPreviewDomain(company.domain)}>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {company.employees}
                  </div>
                </td>
                <td className="py-3 px-4" onClick={() => setPreviewDomain(company.domain)}>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    {company.jobCount}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCompanies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No companies found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your filters</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Company Preview Modal */}
      <CompanyPreview 
        domain={previewDomain} 
        open={!!previewDomain} 
        onClose={() => setPreviewDomain(null)} 
      />
    </div>
  )
}
