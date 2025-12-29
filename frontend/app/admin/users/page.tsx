"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Trash2, Edit2, Search } from "lucide-react"

interface User {
  id: string
  email: string
  username: string
  joinDate: string
  status: "active" | "suspended" | "inactive"
  portfolio: string
}

const mockUsers: User[] = [
  {
    id: "1",
    email: "Yassinebnj@example.com",
    username: "Yassinebnjdoe",
    joinDate: "2024-01-15",
    status: "active",
    portfolio: "$45,230",
  },
  {
    id: "2",
    email: "jane@example.com",
    username: "janesmith",
    joinDate: "2024-02-20",
    status: "active",
    portfolio: "$32,100",
  },
  {
    id: "3",
    email: "bob@example.com",
    username: "bobwilson",
    joinDate: "2024-01-10",
    status: "suspended",
    portfolio: "$18,500",
  },
  {
    id: "4",
    email: "alice@example.com",
    username: "alicejones",
    joinDate: "2023-12-05",
    status: "active",
    portfolio: "$67,890",
  },
  {
    id: "5",
    email: "charlie@example.com",
    username: "charliebrown",
    joinDate: "2024-03-01",
    status: "inactive",
    portfolio: "$5,200",
  },
]

export default function UsersManagement() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((user) => user.id !== id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "suspended":
        return "bg-red-500/20 text-red-400"
      case "inactive":
        return "bg-gray-500/20 text-gray-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
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
              <CardDescription>Showing {filteredUsers.length} users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Username</th>
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
                        <td className="py-3 px-4 text-muted-foreground">{user.joinDate}</td>
                        <td className="py-3 px-4 text-foreground">{user.portfolio}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
