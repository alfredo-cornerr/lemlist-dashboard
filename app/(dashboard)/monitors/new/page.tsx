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
  Clock,
  Info,
  Check,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const steps = [
  { id: "target", label: "Target", description: "What to monitor" },
  { id: "signals", label: "Signals", description: "What to track" },
  { id: "schedule", label: "Schedule", description: "How often" },
  { id: "review", label: "Review", description: "Confirm & create" },
]

const signalOptions = [
  {
    id: "NEWS_EVENTS",
    label: "News Events",
    description: "Funding, acquisitions, partnerships, product launches",
  },
  {
    id: "JOB_OPENINGS",
    label: "Job Openings",
    description: "New positions, hiring trends, role categories",
  },
  {
    id: "TECH_CHANGES",
    label: "Technology Changes",
    description: "New tech stack additions or removals",
  },
  {
    id: "WEBSITE_CHANGES",
    label: "Website Changes",
    description: "Content updates, new pages, messaging changes",
  },
  {
    id: "CONNECTIONS",
    label: "Connections",
    description: "New partnerships, client announcements",
  },
]

const frequencyOptions = [
  { id: "HOURLY", label: "Every hour", multiplier: 24 },
  { id: "DAILY", label: "Daily", multiplier: 1 },
  { id: "WEEKLY", label: "Weekly", multiplier: 1 / 7 },
]

type MonitorData = {
  name: string
  targetType: "SINGLE_COMPANY" | "FILTER_SET"
  targetConfig: { domain?: string; filters?: any[] }
  signals: string[]
  frequency: "HOURLY" | "DAILY" | "WEEKLY"
}

export default function NewMonitorPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [monitorData, setMonitorData] = useState<MonitorData>({
    name: "",
    targetType: "SINGLE_COMPANY",
    targetConfig: { domain: "" },
    signals: [],
    frequency: "DAILY",
  })

  const selectedSignals = signalOptions.filter((s) =>
    monitorData.signals.includes(s.id)
  )
  const creditsPerRun = selectedSignals.length
  const frequencyMultiplier =
    frequencyOptions.find((f) => f.id === monitorData.frequency)?.multiplier || 1
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
    // TODO: API call to create monitor
    router.push("/monitors")
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          monitorData.name.trim() &&
          (monitorData.targetType === "SINGLE_COMPANY"
            ? monitorData.targetConfig.domain?.trim()
            : true)
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/monitors">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Monitors
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Monitor</h1>
        <p className="text-muted-foreground mt-1">
          Set up automated tracking for companies and get notified of important changes
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      index <= currentStep ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-24 h-0.5 mx-4",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          {/* Step 1: Target */}
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="text-sm font-medium mb-2 block">Monitor Name</label>
                <Input
                  placeholder="e.g., Stripe Competitors"
                  value={monitorData.name}
                  onChange={(e) =>
                    setMonitorData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Target Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() =>
                      setMonitorData((prev) => ({
                        ...prev,
                        targetType: "SINGLE_COMPANY",
                        targetConfig: { domain: "" },
                      }))
                    }
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      monitorData.targetType === "SINGLE_COMPANY"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Building2 className="h-6 w-6 mb-2 text-primary" />
                    <div className="font-medium">Single Company</div>
                    <div className="text-sm text-muted-foreground">
                      Monitor one specific company
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      setMonitorData((prev) => ({
                        ...prev,
                        targetType: "FILTER_SET",
                        targetConfig: { filters: [] },
                      }))
                    }
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      monitorData.targetType === "FILTER_SET"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Filter className="h-6 w-6 mb-2 text-primary" />
                    <div className="font-medium">Filter Set</div>
                    <div className="text-sm text-muted-foreground">
                      Monitor multiple companies matching filters
                    </div>
                  </button>
                </div>
              </div>

              {monitorData.targetType === "SINGLE_COMPANY" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Company Domain</label>
                  <Input
                    placeholder="e.g., stripe.com"
                    value={monitorData.targetConfig.domain || ""}
                    onChange={(e) =>
                      setMonitorData((prev) => ({
                        ...prev,
                        targetConfig: { domain: e.target.value },
                      }))
                    }
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Signals */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground">
                Select which types of changes you want to be notified about
              </p>

              {signalOptions.map((signal) => (
                <button
                  key={signal.id}
                  onClick={() => toggleSignal(signal.id)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all flex items-start gap-4",
                    monitorData.signals.includes(signal.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded border flex items-center justify-center mt-0.5",
                      monitorData.signals.includes(signal.id)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {monitorData.signals.includes(signal.id) && (
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{signal.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {signal.description}
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <p className="text-muted-foreground">
                Choose how often to check for new signals
              </p>

              <div className="space-y-3">
                {frequencyOptions.map((freq) => (
                  <button
                    key={freq.id}
                    onClick={() =>
                      setMonitorData((prev) => ({
                        ...prev,
                        frequency: freq.id as any,
                      }))
                    }
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all flex items-center justify-between",
                      monitorData.frequency === freq.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{freq.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {freq.multiplier * creditsPerRun} credits/day
                        </div>
                      </div>
                    </div>
                    {monitorData.frequency === freq.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    <span>
                      This monitor will use approximately{" "}
                      <strong>{monthlyCost} credits</strong> per month
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{monitorData.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium">
                    {monitorData.targetType === "SINGLE_COMPANY"
                      ? monitorData.targetConfig.domain
                      : "Filter Set"}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Signals</span>
                  <div className="flex gap-2">
                    {selectedSignals.map((s) => (
                      <Badge key={s.id} variant="secondary">
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between py-3 border-b border-border/50">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium">
                    {frequencyOptions.find((f) => f.id === monitorData.frequency)?.label}
                  </span>
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

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleCreate}>Create Monitor</Button>
        )}
      </div>
    </div>
  )
}
