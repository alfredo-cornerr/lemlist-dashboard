"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Key, 
  Crown, 
  Trash2, 
  RefreshCw,
  Search,
  Calendar,
  Activity
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { supabaseBrowserClient } from "@/lib/supabase-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface User {
  id: string
  email: string
  has_api_key: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
  activity_count: number
  last_activity_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession()
      
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      })
      
      const data = await response.json()
      setUsers(data.users)
      setFilteredUsers(data.users)
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession()
      
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      })

      if (!response.ok) throw new Error("Failed to delete user")

      toast.success("User deleted successfully")
      setUserToDelete(null)
      fetchUsers()
    } catch (error) {
      toast.error("Failed to delete user")
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter((user) =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage all registered users
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Total: {users.length} users
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.email}</span>
                      {user.is_admin && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {user.activity_count} activities
                      </span>
                      {user.last_activity_at && (
                        <span>
                          Last active: {new Date(user.last_activity_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.has_api_key ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Key className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">No API Key</Badge>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete User</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete {user.email}? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setUserToDelete(null)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteUser}>
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
