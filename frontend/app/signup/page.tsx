"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { register } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"

export default function SignUp() {
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const passwordStrength = formData.password.length > 8 ? "strong" : formData.password.length > 4 ? "medium" : "weak"

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailError(null)
    setPasswordError(null)
    setConfirmError(null)

    // client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let ok = true
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address.')
      ok = false
    }
    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.')
      ok = false
    } else if (!/[0-9]/.test(formData.password) || !/[A-Za-z]/.test(formData.password)) {
      setPasswordError('Password must include letters and numbers.')
      ok = false
    }
    if (formData.password !== formData.confirmPassword) {
      setConfirmError('Passwords do not match.')
      ok = false
    }

    if (!ok) return

    setIsLoading(true)
    try {
      await register(formData.name, formData.email, formData.password)
      toast({ title: "Account created", description: "You can now sign in" })
      router.push("/signin")
    } catch (err: any) {
      const message = err?.message || "Failed to create account"
      toast({ title: "Sign up failed", description: message })
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === 'email') setEmailError(null)
    if (name === 'password') setPasswordError(null)
    if (name === 'confirmPassword') setConfirmError(null)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            CryptoTrack
          </h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border/50 rounded-xl p-8 space-y-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">{error}</div>}
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Yassine bnj"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                required
              />
              {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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

              {passwordError && <p className="text-sm text-destructive mt-1">{passwordError}</p>}

              {/* Password Strength */}
              {formData.password && (
                <div className="flex gap-1">
                  {["weak", "medium", "strong"].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-1 rounded ${
                        (level === "weak" && passwordStrength !== "weak") ||
                        (level === "medium" && ["medium", "strong"].includes(passwordStrength)) ||
                        (level === "strong" && passwordStrength === "strong")
                          ? "bg-accent"
                          : "bg-secondary/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmError && <p className="text-sm text-destructive mt-1">{confirmError}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded bg-secondary border border-border mt-1" required />
              <span className="text-sm text-muted-foreground">I agree to the Terms of Service and Privacy Policy</span>
            </label>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or sign up with</span>
            </div>
          </div>

          {/* Social Sign Up */}
          <div className="grid grid-cols-2 gap-3">
            <button className="px-4 py-2 bg-secondary/50 border border-border rounded-lg hover:bg-secondary transition-colors font-medium text-sm">
              Google
            </button>
            <button className="px-4 py-2 bg-secondary/50 border border-border rounded-lg hover:bg-secondary transition-colors font-medium text-sm">
              GitHub
            </button>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="text-accent hover:text-accent/90 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
