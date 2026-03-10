"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowserClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, CheckCircle, Key, ExternalLink, Sparkles, Mail, BarChart3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export default function OnboardingPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    // Get user email for welcome message
    const getUser = async () => {
      const { data: { user } } = await supabaseBrowserClient.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    getUser()
  }, [])

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setErrorMessage("Please enter an API key")
      return
    }

    setIsTesting(true)
    setTestStatus("idle")
    setErrorMessage(null)

    try {
      const response = await fetch("/api/lemlist/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestStatus("success")
      } else {
        setTestStatus("error")
        setErrorMessage(data.error || "Failed to connect to Lemlist API")
      }
    } catch (error) {
      setTestStatus("error")
      setErrorMessage("Network error. Please try again.")
    } finally {
      setIsTesting(false)
    }
  }

  const saveApiKey = async () => {
    setIsSaving(true)
    setErrorMessage(null)

    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession()
      
      const response = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({ apiKey }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save API key")
      }

      // Success! Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save API key")
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    // Allow users to skip and explore the app without API key
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome{userEmail ? `, ${userEmail.split('@')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Let&apos;s connect your Lemlist account to get started
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-indigo-600 font-medium">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs">1</div>
            Connect Lemlist
          </div>
          <Separator className="w-8" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">2</div>
            View Campaigns
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
              </div>
            </div>
            <CardTitle className="text-xl">Connect your Lemlist account</CardTitle>
            <CardDescription>
              Paste your Lemlist API key below. We&apos;ll verify it and then you&apos;ll see all your campaign data.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            {testStatus === "success" && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>✅ Connection successful! Your API key is valid.</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-base">
                Lemlist API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="lem_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setTestStatus("idle")
                  setErrorMessage(null)
                }}
                disabled={isTesting || isSaving}
                className="h-12"
              />
              <p className="text-sm text-muted-foreground">
                Find your API key in{" "}
                <a 
                  href="https://app.lemlist.com/settings/integrations" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 font-medium"
                >
                  Lemlist Settings → Integrations
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Test Button */}
            <Button
              onClick={testConnection}
              variant="outline"
              className="w-full h-11"
              disabled={isTesting || !apiKey.trim() || isSaving}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing connection...
                </>
              ) : testStatus === "success" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Connection verified
                </>
              ) : (
                "Test connection"
              )}
            </Button>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={saveApiKey}
              className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              disabled={isSaving || testStatus !== "success"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Connect & Go to Dashboard"
              )}
            </Button>
            
            <Button
              onClick={handleSkip}
              variant="ghost"
              className="w-full"
            >
              Skip for now →
            </Button>
          </CardFooter>
        </Card>

        {/* What You'll Get */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50">
            <Mail className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
            <p className="text-sm font-medium">Campaign Overview</p>
          </div>
          <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-sm font-medium">Real-time Stats</p>
          </div>
          <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-pink-500" />
            <p className="text-sm font-medium">Lead Insights</p>
          </div>
        </div>
      </div>
    </div>
  )
}
