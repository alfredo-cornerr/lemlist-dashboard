"use client"

import { useState } from "react"
import { Search, Filter, MapPin, Building2, Briefcase, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const mockJobs = [
  {
    id: "1",
    title: "Senior Software Engineer",
    company: "Stripe",
    domain: "stripe.com",
    location: "San Francisco, CA",
    category: "Engineering",
    seniority: "Senior",
    postedAt: "2 days ago",
    salary: "$180k - $250k",
    remote: true,
  },
  {
    id: "2",
    title: "Product Manager",
    company: "Notion",
    domain: "notion.so",
    location: "New York, NY",
    category: "Product",
    seniority: "Mid",
    postedAt: "1 week ago",
    salary: "$140k - $180k",
    remote: false,
  },
]

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Job Openings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              8.5M active job postings from 2M+ companies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search job titles, companies..."
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
        <div className="space-y-4">
          {mockJobs.map((job) => (
            <div key={job.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {job.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {job.company}
                      <span>•</span>
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                      {job.remote && <Badge variant="secondary">Remote</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline">{job.category}</Badge>
                      <Badge variant="outline">{job.seniority}</Badge>
                      <span className="text-sm text-muted-foreground">{job.salary}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {job.postedAt}
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
