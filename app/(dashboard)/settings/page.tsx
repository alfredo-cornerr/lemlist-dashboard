"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, 
  Loader2, 
  CheckCircle, 
  Key, 
  ExternalLink,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"
import { getToken } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasExistingKey, setHasExistingKey] = useState(false)

  useEffect(() => {
    // Check if user has an existing API key
    const checkExistingKey = async () => {
      try {
        const token = getToken()
        
        const response = await fetch("/api/user/api-key", {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.hasKey) {
            setHasExistingKey(true)
            if (data.apiKey) {
              setApiKey(data.apiKey) // Show existing key
            }
          }
        } else {
          console.error("Failed to check API key:", await response.text())
        }
      } catch (err) {
        console.error("Error checking existing key:", err)
      }
    }
    checkExistingKey()
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
        toast.success("API key is valid!")
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
      const token = getToken()
      
      const response = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ apiKey }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save API key")
      }

      setHasExistingKey(true)
      setApiKey("")
      setTestStatus("idle")
      toast.success("API key saved! Starting sync...")
      
      // Trigger automatic sync
      setTimeout(async () => {
        try {
          const syncRes = await fetch("/api/sync-new", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : '',
            },
          })
          
          if (syncRes.ok) {
            const data = await syncRes.json()
            toast.success(`Sync started! ${data.campaigns} campaigns found.`)
          }
        } catch (e) {
          // Ignore sync errors
        }
      }, 1000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save API key")
    } finally {
      setIsSaving(false)
    }
  }

  const revokeApiKey = async () => {
    setIsRevoking(true)

    try {
      const token = getToken()
      
      const response = await fetch("/api/user/api-key", {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to revoke API key")
      }

      setHasExistingKey(false)
      setApiKey("")
      toast.success("API key revoked successfully")
      router.push("/onboarding")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke API key")
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and API connections
        </p>
      </div>

      {/* API Key Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Lemlist API Key</CardTitle>
          </div>
          <CardDescription>
            Connect your Lemlist account to sync campaign data
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
              <AlertDescription>Connection successful! Your API key is valid.</AlertDescription>
            </Alert>
          )}

          {hasExistingKey && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your Lemlist API key is configured and working.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {hasExistingKey ? "Update API Key" : "API Key"}
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder={hasExistingKey ? "Enter new API key to update" : "lem_xxxxxxxxxxxxxxxxxxxxxxxx"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setTestStatus("idle")
                }}
                disabled={isTesting || isSaving}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              You can find your API key in your{" "}
              <a 
                href="https://app.lemlist.com/settings/integrations" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                Lemlist settings
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {apiKey && (
            <Button
              onClick={testConnection}
              variant="outline"
              className="w-full"
              disabled={isTesting || !apiKey.trim()}
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
          )}

          {apiKey && (
            <Button
              onClick={saveApiKey}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              disabled={isSaving || testStatus !== "success"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : hasExistingKey ? (
                "Update API key"
              ) : (
                "Save API key"
              )}
            </Button>
          )}

          {hasExistingKey && !apiKey && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revoke API key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Revoke API Key</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to revoke your Lemlist API key? This will disconnect your account and you&apos;ll need to reconnect to access your campaign data.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={revokeApiKey}
                    disabled={isRevoking}
                  >
                    {isRevoking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      "Revoke API key"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
