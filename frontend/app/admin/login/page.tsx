"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield } from "lucide-react"

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Simulate API call to verify admin credentials
      // In production, this would call your backend API
      const hardcodedAdmins = [
        { email: "admin@cryptotrack.com", password: "admin123" },
        { email: "superadmin@cryptotrack.com", password: "superadmin123" },
      ]

      const adminUser = hardcodedAdmins.find((admin) => admin.email === email && admin.password === password)

      if (!adminUser) {
        setError("Invalid admin credentials")
        setIsLoading(false)
        return
      }

      // Store admin session in localStorage (in production, use secure HTTP-only cookies)
      const adminSession = {
        email,
        role: "admin",
        loginTime: new Date().toISOString(),
      }
      localStorage.setItem("adminSession", JSON.stringify(adminSession))

      // Redirect to admin dashboard
      setTimeout(() => {
        router.push("/admin")
      }, 500)
    } catch (err) {
      setError("An error occurred during login")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with Admin Icon */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-accent/20 rounded-full">
              <Shield className="w-8 h-8 text-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Portal</h1>
          <p className="text-muted-foreground">CryptoTrack Administration</p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border/50 rounded-xl p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cryptotrack.com"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? "Logging in..." : "Admin Login"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Demo Credentials</span>
            </div>
          </div>

          {/* Demo Credentials Info */}
          <div className="bg-secondary/50 border border-border/50 rounded-lg p-4 text-sm space-y-2">
            <p className="text-muted-foreground">
              <strong>Email:</strong> admin@cryptotrack.com
            </p>
            <p className="text-muted-foreground">
              <strong>Password:</strong> admin123
            </p>
          </div>
        </div>

        {/* Back to User Login */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          User account?{" "}
          <Link href="/signin" className="text-accent hover:text-accent/90 font-semibold">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
