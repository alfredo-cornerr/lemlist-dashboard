"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  Filter,
  Bell,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
  Info,
  Check,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const steps = [
  { id: "target", label: "Target", description: "What companies to monitor" },
  { id: "signals", label: "Signal Types", description: "What changes to track" },
  { id: "schedule", label: "Schedule", description: "How often to check" },
  { id: "review", label: "Review", description: "Confirm and create" },
]

const signalOptions = [
  {
    id: "news",
    label: "News Events",
    description: "Funding, acquisitions, partnerships, product launches, executive hires",
    icon: Bell,
    color: "bg-blue-500",
  },
  {
    id: "jobs",
    label: "Job Openings",
    description: "New positions, hiring trends, role categories, seniority levels",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    id: "tech",
    label: "Technology Changes",
    description: "New SaaS adoption, tech stack additions, vendor switches",
    icon: Activity,
    color: "bg-purple-500",
  },
  {
    id: "web",
    label: "Website Changes",
    description: "Content updates, new pages, messaging changes, pricing updates",
    icon: ArrowUpRight,
    color: "bg-orange-500",
  },
]

const frequencyOptions = [
  { id: "hourly", label: "Every hour", multiplier: 24 },
  { id: "daily", label: "Daily", multiplier: 1 },
  { id: "weekly", label: "Weekly", multiplier: 1 / 7 },
]

export default function NewSignalMonitorPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [monitorData, setMonitorData] = useState({
    name: "",
    targetType: "companies" as "companies" | "filter",
    targetCompanies: [""],
    targetFilter: "",
    signals: [] as string[],
    frequency: "daily" as "hourly" | "daily" | "weekly",
  })

  const selectedSignals = signalOptions.filter((s) =>
    monitorData.signals.includes(s.id)
  )
  const creditsPerRun = selectedSignals.length * (monitorData.targetType === "companies" ? monitorData.targetCompanies.filter(Boolean).length : 10)
  const frequencyMultiplier = frequencyOptions.find((f) => f.id === monitorData.frequency)?.multiplier || 1
  const dailyCost = creditsPerRun * frequencyMultiplier
  const monthlyCost = Math.round(dailyCost * 30)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleSignal = (signalId: string) => {
    setMonitorData((prev) => ({
      ...prev,
      signals: prev.signals.includes(signalId)
        ? prev.signals.filter((s) => s !== signalId)
        : [...prev.signals, signalId],
    }))
  }

  const handleCreate = () => {
    router.push("/signals")
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          monitorData.name.trim() &&
          (monitorData.targetType === "companies"
            ? monitorData.targetCompanies.some((c) => c.trim())
            : monitorData.targetFilter.trim())
        )
      case 1:
        return monitorData.signals.length > 0
      case 2:
        return true
      default:
        return true
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <Link href="/signals">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Signals
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Create Signal Monitor</h1>
        <p className="text-muted-foreground mt-1">
          Set up automated monitoring for company changes and events
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    index <= currentStep ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <div className="mt-2 text-center">
                  <div className={cn("text-sm font-medium", index <= currentStep ? "text-foreground" : "text-muted-foreground")}>
                    {step.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-4", index < currentStep ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {currentStep === 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Monitor Name</label>
                <Input
                  placeholder="e.g., Stripe Competitors"
                  value={monitorData.name}
                  onChange={(e) => setMonitorData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Target Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMonitorData((prev) => ({ ...prev, targetType: "companies" }))}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      monitorData.targetType === "companies" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <Building2 className="h-6 w-6 mb-2 text-primary" />
                    <div className="font-medium">Specific Companies</div>
                    <div className="text-sm text-muted-foreground">Monitor up to 50 companies by domain</div>
                  </button>
                  <button
                    onClick={() => setMonitorData((prev) => ({ ...prev, targetType: "filter" }))}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      monitorData.targetType === "filter" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <Filter className="h-6 w-6 mb-2 text-primary" />
                    <div className="font-medium">Filter Set</div>
                    <div className="text-sm text-muted-foreground">Monitor all companies matching filters</div>
                  </button>
                </div>
              </div>

              {monitorData.targetType === "companies" ? (
                <div>
                  <label className="text-sm font-medium mb-2 block">Company Domains</label>
                  <div className="space-y-2">
                    {monitorData.targetCompanies.map((domain, index) => (
                      <Input
                        key={index}
                        placeholder="e.g., stripe.com"
                        value={domain}
                        onChange={(e) => {
                          const newCompanies = [...monitorData.targetCompanies]
                          newCompanies[index] = e.target.value
                          setMonitorData((prev) => ({ ...prev, targetCompanies: newCompanies }))
                        }}
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMonitorData((prev) => ({ ...prev, targetCompanies: [...prev.targetCompanies, ""] }))}
                    >
                      + Add another company
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter Query</label>
                  <Input
                    placeholder="e.g., industry:SaaS location:United States"
                    value={monitorData.targetFilter}
                    onChange={(e) => setMonitorData((prev) => ({ ...prev, targetFilter: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use filters like industry, location, technology, employee_count, etc.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <p className="text-muted-foreground">Select which types of changes you want to be notified about</p>

              {signalOptions.map((signal) => {
                const Icon = signal.icon
                return (
                  <button
                    key={signal.id}
                    onClick={() => toggleSignal(signal.id)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all flex items-start gap-4",
                      monitorData.signals.includes(signal.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn("h-5 w-5 rounded border flex items-center justify-center mt-0.5", monitorData.signals.includes(signal.id) ? "bg-primary border-primary" : "border-muted-foreground")}>
                      {monitorData.signals.includes(signal.id) && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded flex items-center justify-center", signal.color)}>
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="font-medium">{signal.label}</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{signal.description}</div>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <p className="text-muted-foreground">Choose how often to check for new signals</p>

              <div className="space-y-3">
                {frequencyOptions.map((freq) => (
                  <button
                    key={freq.id}
                    onClick={() => setMonitorData((prev) => ({ ...prev, frequency: freq.id as any }))}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all flex items-center justify-between",
                      monitorData.frequency === freq.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{freq.label}</div>
                        <div className="text-sm text-muted-foreground">{Math.round(creditsPerRun * freq.multiplier)} credits/day</div>
                      </div>
                    </div>
                    {monitorData.frequency === freq.id && <Check className="h-5 w-5 text-primary" />}
                  </button>
                ))}
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    <span>This monitor will use approximately <strong>{monthlyCost} credits</strong> per month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{monitorData.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium">
                    {monitorData.targetType === "companies" ? `${monitorData.targetCompanies.filter(Boolean).length} companies` : "Filter set"}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground">Signals</span>
                  <div className="flex gap-2">
                    {selectedSignals.map((s) => (
                      <Badge key={s.id} variant="secondary">{s.label}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium">{frequencyOptions.find((f) => f.id === monitorData.frequency)?.label}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Monthly Cost</span>
                  <span className="font-medium text-primary">{monthlyCost} credits</span>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>Back</Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next<ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleCreate}>Create Monitor</Button>
        )}
      </div>
    </div>
  )
}
