"use client"

import { useState } from "react"
import Sidebar from "@/components/dashboard/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { changePassword } from "@/lib/api-service"

export default function EditPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all fields.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.")
      return
    }

    try {
      setLoading(true)
      await changePassword(currentPassword, newPassword)
      setSuccess("Password changed successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setError(err?.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-card border-b border-border p-6">
          <h1 className="text-3xl font-bold">Change Password</h1>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-2xl mx-auto">
            <Card className="bg-card border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle>Update your password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Current password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">New password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Confirm new password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-lg"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {success && <p className="text-sm text-success">{success}</p>}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2 px-4 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60"
                    >
                      {loading ? "Updating..." : "Change Password"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
