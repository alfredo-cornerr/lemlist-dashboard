"use client"

import { useState } from "react"
import { Download, FileText, CheckCircle, XCircle, Loader2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const mockExports = [
  {
    id: "exp_1",
    status: "completed",
    name: "SaaS Companies - March 2024",
    totalCompanies: 150,
    creditsUsed: 150,
    filters: ["Technology: Salesforce", "Location: United States"],
    createdAt: "2024-03-07",
    completedAt: "2024-03-07",
  },
  {
    id: "exp_2",
    status: "processing",
    name: "AI Startups - Funding Round",
    totalCompanies: 500,
    creditsUsed: 500,
    filters: ["Industry: AI", "Signal: Funding"],
    createdAt: "2024-03-07",
    completedAt: null,
  },
  {
    id: "exp_3",
    status: "completed",
    name: "HubSpot Customers",
    totalCompanies: 75,
    creditsUsed: 75,
    filters: ["Technology: HubSpot"],
    createdAt: "2024-03-06",
    completedAt: "2024-03-06",
  },
]

const statusConfig = {
  pending: { label: "Pending", icon: Loader2, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  processing: { label: "Processing", icon: Loader2, color: "text-blue-600", bgColor: "bg-blue-50" },
  completed: { label: "Completed", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
}

export default function ExportsPage() {
  const [exports] = useState(mockExports)

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">Exports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Download your company data exports
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exports</p>
                  <p className="text-3xl font-bold mt-1">{exports.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Companies Exported</p>
                  <p className="text-3xl font-bold mt-1">
                    {exports.reduce((sum, e) => sum + e.totalCompanies, 0).toLocaleString()}
                  </p>
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
                  <p className="text-sm text-muted-foreground">Credits Used</p>
                  <p className="text-3xl font-bold mt-1">
                    {exports.reduce((sum, e) => sum + e.creditsUsed, 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Download className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exports.map((exportItem) => {
                const status = statusConfig[exportItem.status as keyof typeof statusConfig]
                const StatusIcon = status.icon

                return (
                  <div
                    key={exportItem.id}
                    className={cn("p-4 rounded-lg border", status.bgColor)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={cn("h-5 w-5", status.color)} />
                          <span className="font-medium">{exportItem.name}</span>
                          <Badge variant="outline">{status.label}</Badge>
                        </div>

                        <div className="flex items-center gap-2 mt-2 ml-8">
                          {exportItem.filters.map((filter, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {filter}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 mt-2 ml-8 text-sm text-muted-foreground">
                          <span>{exportItem.totalCompanies.toLocaleString()} companies</span>
                          <span>{exportItem.creditsUsed} credits</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {exportItem.createdAt}
                          </span>
                        </div>
                      </div>

                      {exportItem.status === "completed" && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
