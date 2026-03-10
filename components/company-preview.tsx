"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getCompany, getJobOpenings, getTechnologyDetections, getNewsEvents } from "@/lib/api-client"
import { Building2, MapPin, Globe, Briefcase, Cpu, Newspaper, Download, X } from "lucide-react"

interface CompanyPreviewProps {
  domain: string | null
  open: boolean
  onClose: () => void
}

export function CompanyPreview({ domain, open, onClose }: CompanyPreviewProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [technologies, setTechnologies] = useState<any[]>([])
  const [news, setNews] = useState<any[]>([])

  useEffect(() => {
    if (!domain || !open) return

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        // Fetch company data (FREE preview - no credits)
        const companyData = await getCompany(domain!)
        setData(companyData.data)

        // Fetch related data in parallel
        const [jobsData, techData, newsData] = await Promise.all([
          getJobOpenings(domain!, { per_page: 5 }).catch(() => null),
          getTechnologyDetections(domain!, { per_page: 10 }).catch(() => null),
          getNewsEvents(domain!, { per_page: 5 }).catch(() => null),
        ])

        setJobs(jobsData?.data || [])
        setTechnologies(techData?.data || [])
        setNews(newsData?.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load company data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [domain, open])

  if (!domain) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : error ? (
            <div className="text-destructive">
              <DialogTitle>Error loading company</DialogTitle>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : data ? (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                {data.attributes?.company_name?.slice(0, 2).toUpperCase() || domain.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl">
                  {data.attributes?.company_name || domain}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {domain}
                  </span>
                  {data.attributes?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {data.attributes.location}
                    </span>
                  )}
                  {data.attributes?.ticker && (
                    <Badge variant="secondary">{data.attributes.ticker}</Badge>
                  )}
                </div>
                {data.attributes?.description && (
                  <p className="text-sm mt-3 text-muted-foreground">
                    {data.attributes.description}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </DialogHeader>

        {!loading && !error && data && (
          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">
                Jobs ({jobs.length})
              </TabsTrigger>
              <TabsTrigger value="tech">
                Tech ({technologies.length})
              </TabsTrigger>
              <TabsTrigger value="news">
                News ({news.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    Open Positions
                  </div>
                  <p className="text-2xl font-bold mt-1">{jobs.length}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cpu className="h-4 w-4" />
                    Technologies
                  </div>
                  <p className="text-2xl font-bold mt-1">{technologies.length}</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Recent Signals</h4>
                {news.length > 0 ? (
                  <div className="space-y-2">
                    {news.slice(0, 3).map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Newspaper className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{item.attributes?.summary || "News event detected"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent signals</p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div>
                  <p className="font-medium">Want the full data?</p>
                  <p className="text-sm text-muted-foreground">
                    Export this company for 1 credit
                  </p>
                </div>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export (1 credit)
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-3">
              {jobs.length > 0 ? (
                jobs.map((job: any, i: number) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{job.attributes?.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{job.attributes?.location}</span>
                          {job.attributes?.seniority && (
                            <Badge variant="secondary" className="text-xs">
                              {job.attributes.seniority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {job.attributes?.salary && (
                        <span className="text-sm font-medium">
                          {job.attributes.salary}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No job openings found
                </p>
              )}
            </TabsContent>

            <TabsContent value="tech" className="space-y-3">
              {technologies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                      {tech.relationships?.technology?.data?.attributes?.name || "Unknown"}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No technologies detected
                </p>
              )}
            </TabsContent>

            <TabsContent value="news" className="space-y-3">
              {news.length > 0 ? (
                news.map((item: any, i: number) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Newspaper className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-medium">{item.attributes?.summary}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {item.attributes?.category}
                          </Badge>
                          <span>
                            {item.attributes?.confidence &&
                              `${Math.round(item.attributes.confidence * 100)}% confidence`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No news events found
                </p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
