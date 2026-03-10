"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Download,
  Building2,
  MapPin,
  Users,
  ArrowUpDown,
  CheckSquare,
  Square,
  MoreHorizontal,
  Loader2,
  ExternalLink,
  X,
  Briefcase,
  Cpu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { apiClient, FILTER_OPTIONS } from "@/lib/api-client"

// Technology options for autocomplete
const TECHNOLOGY_OPTIONS = FILTER_OPTIONS.technologies
const LOCATION_OPTIONS = FILTER_OPTIONS.locations
const COMPANY_SIZE_OPTIONS = FILTER_OPTIONS.companySizes
const INDUSTRY_OPTIONS = FILTER_OPTIONS.industries

interface Company {
  id: string
  type: string
  attributes: {
    domain: string
    company_name: string | null
    friendly_company_name: string
    location: string | null
    description: string | null
    employee_count?: string
    industry?: string
  }
}

interface FilterState {
  technology: string
  location: string
  companySize: string
  industry: string
}

export default function DatabasePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    technology: "",
    location: "",
    companySize: "",
    industry: "",
  })
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set())
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  
  // Autocomplete states
  const [techSuggestions, setTechSuggestions] = useState<string[]>([])
  const [showTechSuggestions, setShowTechSuggestions] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)

  // Refs for click outside handling
  const techInputRef = useRef<HTMLDivElement>(null)
  const locationInputRef = useRef<HTMLDivElement>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (techInputRef.current && !techInputRef.current.contains(event.target as Node)) {
        setShowTechSuggestions(false)
      }
      if (locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch companies - using local endpoint instead of direct API
  const fetchCompanies = useCallback(async () => {
    setIsLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      if (searchQuery) params.set('query', searchQuery)
      if (filters.technology) params.set('technology', filters.technology)
      if (filters.location) params.set('location', filters.location)
      if (filters.industry) params.set('industry', filters.industry)
      if (filters.companySize) params.set('company_size', filters.companySize)
      params.set('page', String(currentPage))
      params.set('perPage', '20')
      
      const response = await fetch(`/api/companies/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch')
      }
      
      const data = await response.json()

      if (data.data) {
        setCompanies(data.data)
        setTotalResults(data.meta?.total || data.data.length)
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error)
      // Don't show error toast, just log it - the API route handles fallback
      setCompanies([])
      setTotalResults(0)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, filters, currentPage])

  // Initial load
  useEffect(() => {
    fetchCompanies()
  }, [])

  // Handle filter changes
  const applyFilters = () => {
    setCurrentPage(1)
    fetchCompanies()
  }

  // Technology autocomplete
  const handleTechInput = (value: string) => {
    setFilters(prev => ({ ...prev, technology: value }))
    if (value.length > 0) {
      const matches = TECHNOLOGY_OPTIONS.filter(t => 
        t.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10)
      setTechSuggestions(matches)
      setShowTechSuggestions(true)
    } else {
      setShowTechSuggestions(false)
    }
  }

  // Location autocomplete
  const handleLocationInput = (value: string) => {
    setFilters(prev => ({ ...prev, location: value }))
    if (value.length > 0) {
      const matches = LOCATION_OPTIONS.filter(l => 
        l.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setLocationSuggestions(matches)
      setShowLocationSuggestions(true)
    } else {
      setShowLocationSuggestions(false)
    }
  }

  const clearFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: "" }))
    setTimeout(applyFilters, 0)
  }

  const clearAllFilters = () => {
    setFilters({
      technology: "",
      location: "",
      companySize: "",
      industry: "",
    })
    setSearchQuery("")
    setCurrentPage(1)
    fetchCompanies()
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0)

  // FIXED: Export uses domains, not IDs
  async function handleExport() {
    if (selectedCompanyIds.size === 0) {
      toast.error("Select at least one company to export")
      return
    }

    // Map selected IDs to domains
    const selectedDomains: string[] = []
    selectedCompanyIds.forEach(id => {
      const company = companies.find(c => c.id === id)
      if (company) {
        selectedDomains.push(company.attributes.domain)
      }
    })

    if (selectedDomains.length === 0) {
      toast.error("Could not find company domains to export")
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: selectedDomains }),
      })

      if (!response.ok) throw new Error('Export failed')
      
      const data = await response.json()
      
      if (data.data.successful === 0) {
        toast.error("No companies could be exported")
        setIsExporting(false)
        return
      }
      
      toast.success(`Exported ${data.data.successful} companies successfully!`)
      
      // Auto-download the CSV
      if (data.data.export?.downloadUrl) {
        const downloadResponse = await fetch(data.data.export.downloadUrl)
        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `cornect-export-${data.data.export.id}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }
      }
      
      setSelectedCompanyIds(new Set())
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const toggleCompanySelection = (id: string) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedCompanyIds.size === companies.length) {
      setSelectedCompanyIds(new Set())
    } else {
      setSelectedCompanyIds(new Set(companies.map((c) => c.id)))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Database</h1>
          <p className="text-muted-foreground mt-1">
            Search through 96M+ companies with powerful filters
          </p>
        </div>
        {selectedCompanyIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <span className="text-sm text-muted-foreground">
              {selectedCompanyIds.size} companies selected
            </span>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export ({selectedCompanyIds.size} credits)
            </Button>
          </motion.div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="pl-10 bg-background"
              />
            </div>
            <Button onClick={applyFilters}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-2xl font-bold text-white">{totalResults.toLocaleString()}</span>
              <span>companies match</span>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50"
            >
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setSearchQuery(""); applyFilters() }} />
                </Badge>
              )}
              {filters.technology && (
                <Badge variant="secondary" className="gap-1">
                  <Cpu className="h-3 w-3" />
                  {filters.technology}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("technology")} />
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {filters.location}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("location")} />
                </Badge>
              )}
              {filters.companySize && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {COMPANY_SIZE_OPTIONS.find(s => s.value === filters.companySize)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("companySize")} />
                </Badge>
              )}
              {filters.industry && (
                <Badge variant="secondary" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {filters.industry}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("industry")} />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Filter Sidebar + Results */}
      <div className="grid grid-cols-12 gap-6">
        {/* Filters */}
        <div className="col-span-3 space-y-4">
          {/* Technology Filter */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Technology
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative" ref={techInputRef}>
                <Input
                  placeholder="Search technology..."
                  value={filters.technology}
                  onChange={(e) => handleTechInput(e.target.value)}
                  onFocus={() => filters.technology && setShowTechSuggestions(true)}
                  className="h-9"
                />
                {showTechSuggestions && techSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                    {techSuggestions.map((tech) => (
                      <button
                        key={tech}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent bg-background"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, technology: tech }))
                          setShowTechSuggestions(false)
                          applyFilters()
                        }}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Filter */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative" ref={locationInputRef}>
                <Input
                  placeholder="Search location..."
                  value={filters.location}
                  onChange={(e) => handleLocationInput(e.target.value)}
                  onFocus={() => filters.location && setShowLocationSuggestions(true)}
                  className="h-9"
                />
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                    {locationSuggestions.map((loc) => (
                      <button
                        key={loc}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent bg-background"
                        onClick={() => {
                          setFilters(prev => ({ ...prev, location: loc }))
                          setShowLocationSuggestions(false)
                          applyFilters()
                        }}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Size Filter */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Company Size
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {COMPANY_SIZE_OPTIONS.map((size) => (
                  <label
                    key={size.value}
                    className="flex items-center gap-2 text-sm cursor-pointer group py-1"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        filters.companySize === size.value
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30 group-hover:border-primary/50"
                      )}
                      onClick={() => {
                        setFilters(prev => ({ 
                          ...prev, 
                          companySize: prev.companySize === size.value ? "" : size.value 
                        }))
                        setTimeout(applyFilters, 0)
                      }}
                    >
                      {filters.companySize === size.value && (
                        <CheckSquare className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {size.label}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Industry Filter */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Industry
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {INDUSTRY_OPTIONS.map((industry) => (
                  <label
                    key={industry}
                    className="flex items-center gap-2 text-sm cursor-pointer group py-1"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        filters.industry === industry
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30 group-hover:border-primary/50"
                      )}
                      onClick={() => {
                        setFilters(prev => ({ 
                          ...prev, 
                          industry: prev.industry === industry ? "" : industry 
                        }))
                        setTimeout(applyFilters, 0)
                      }}
                    >
                      {filters.industry === industry && (
                        <CheckSquare className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs">
                      {industry}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <div className="col-span-9">
          <Card className="border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="w-12 px-4 py-3">
                      <button
                        onClick={selectAll}
                        className="flex items-center justify-center"
                      >
                        {selectedCompanyIds.size === companies.length && companies.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <button className="flex items-center gap-1 hover:text-foreground">
                        Company
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-4">
                          <Skeleton className="h-4 w-4" />
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-10 w-48" />
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-4 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td></td>
                      </tr>
                    ))
                  ) : companies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        {activeFilterCount > 0 
                          ? "No companies found. Try different filters." 
                          : "Search for companies or select filters to get started."}
                      </td>
                    </tr>
                  ) : (
                    companies.map((company, index) => (
                      <motion.tr
                        key={company.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "group hover:bg-accent/50 transition-colors",
                          selectedCompanyIds.has(company.id) && "bg-primary/5"
                        )}
                      >
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleCompanySelection(company.id)}
                            className="flex items-center justify-center"
                          >
                            {selectedCompanyIds.has(company.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground font-semibold text-sm">
                              {(company.attributes.company_name || company.attributes.domain).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {company.attributes.company_name || company.attributes.friendly_company_name}
                              </div>
                              <a 
                                href={`https://${company.attributes.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {company.attributes.domain}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {company.attributes.location || "Unknown"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="secondary" className="text-xs">
                            {company.attributes.employee_count || "Unknown"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-muted-foreground">
                            {company.attributes.industry || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                Showing {companies.length > 0 ? (currentPage - 1) * 20 + 1 : 0}-{Math.min(currentPage * 20, totalResults)} of {totalResults.toLocaleString()} results
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={companies.length < 20 || isLoading}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
