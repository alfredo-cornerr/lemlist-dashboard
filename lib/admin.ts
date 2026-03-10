import { supabaseAdmin } from "@/lib/supabase-server"

export interface AdminUser {
  id: string
  email: string
  has_api_key: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
  activity_count: number
  last_activity_at: string | null
}

export interface ActivityLog {
  id: string
  user_id: string
  user_email?: string
  action: string
  details: Record<string, unknown>
  created_at: string
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_users_view")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return data || []
}

export async function getRecentActivity(limit = 50): Promise<ActivityLog[]> {
  const { data, error } = await supabaseAdmin
    .from("activity_logs")
    .select(`
      *,
      user:user_id (email)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch activity: ${error.message}`)
  }

  return (data || []).map((log: any) => ({
    ...log,
    user_email: log.user?.email,
  }))
}

export async function getUserStats() {
  const { data: totalUsers, error: error1 } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true })

  if (error1) throw error1

  const { data: activeUsers, error: error2 } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("lemlist_api_key", "is", null)

  if (error2) throw error2

  const { data: todaySignups, error: error3 } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (error3) throw error3

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    todaySignups: todaySignups || 0,
  }
}

export async function setUserAdminStatus(userId: string, isAdmin: boolean) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`)
  }
}

export async function deleteUser(userId: string) {
  // Delete from auth (cascades to profiles via FK)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`)
  }
}

export async function logActivity(
  userId: string,
  action: string,
  details: Record<string, unknown> = {}
) {
  const { error } = await supabaseAdmin
    .from("activity_logs")
    .insert({
      user_id: userId,
      action,
      details,
    })

  if (error) {
    console.error("Failed to log activity:", error)
  }
}
