"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { getAdminUsers, deleteAdminUser, updateAdminUserStatus, type AdminUser } from "@/lib/api-service"
import { Trash2, Edit2, Search, AlertCircle } from "lucide-react"

export default function UsersManagement() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const data = await getAdminUsers()
        setUsers(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchUsers()
    }
  }, [isAuthenticated])

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      await deleteAdminUser(userId)
      setUsers(users.filter((user) => user.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
      console.error('Error:', err)
    }
  }

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    try {
      // Toggle: if currently active -> set inactive; if inactive -> set active
      const newStatus = currentStatus !== 'active'
      await updateAdminUserStatus(userId, newStatus)
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: newStatus ? 'active' : 'inactive' } : user,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status')
      console.error('Error:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "inactive":
        return "bg-gray-500/20 text-gray-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  if (authLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground mt-2">Manage and monitor user accounts</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-primary">{users.length}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="text-red-400" size={20} />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Users Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {loading ? 'Loading users...' : `Showing ${filteredUsers.length} of ${users.length} users`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Username</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Full Name</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Join Date</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Portfolio</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-sidebar-accent transition-colors">
                          <td className="py-3 px-4 text-foreground">{user.email}</td>
                          <td className="py-3 px-4 text-foreground">{user.username}</td>
                          <td className="py-3 px-4 text-foreground">{user.full_name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{new Date(user.join_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-foreground">{user.portfolio_value}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleStatus(user.id, user.status)}
                              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${getStatusColor(user.status)}`}
                            >
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                                title="Delete user"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
