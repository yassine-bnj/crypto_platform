"use client"

import React from "react"
import { login as apiLogin, logout as apiLogout, getAccessToken, setAccessToken, authFetch, API_BASE_URL, updateProfile as apiUpdateProfile } from "@/lib/api-service"

type AuthContextType = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  user?: { id: number; email: string; name?: string; phone?: string; country?: string } | null
  updateProfile: (payload: { full_name?: string; email?: string; phone?: string; country?: string }) => Promise<any>
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false)
  const [user, setUser] = React.useState<{ id: number; email: string; name?: string; phone?: string; country?: string } | null>(null)

  // try to refresh access token from httpOnly cookie on mount
  React.useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
          const rr = await fetch(`${API_BASE_URL}/auth/refresh/`, { method: 'POST', credentials: 'include' })
        if (rr.ok) {
          const data = await rr.json().catch(() => ({}))
          if (data.access) {
            setAccessToken(data.access)
            // Set cookie for middleware access
            document.cookie = `access_token=${data.access}; path=/; max-age=3600; SameSite=Lax`
            if (mounted) setIsAuthenticated(true)
            // fetch profile
            try {
              const meRes = await authFetch(`${API_BASE_URL}/auth/me/`, { method: 'GET' })
              if (meRes.ok) {
                const me = await meRes.json().catch(() => null)
                if (me && mounted) setUser(me)
              }
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  const login = async (email: string, password: string) => {
    console.log('[Auth] Login attempt:', email)
    const data = await apiLogin(email, password)
    console.log('[Auth] Login response:', data)
    if (data?.access) {
      setAccessToken(data.access)
      setIsAuthenticated(true)
      console.log('[Auth] Token set, fetching user...')
      try {
        const meRes = await authFetch(`${API_BASE_URL}/auth/me/`, { method: 'GET' })
        console.log('[Auth] Me response:', meRes.status)
        if (meRes.ok) {
          const me = await meRes.json().catch(() => null)
          console.log('[Auth] User data:', me)
          setUser(me)
        }
      } catch (e) {
        console.error('[Auth] Me fetch error:', e)
      }
    } else {
      console.error('[Auth] No access token in response')
    }
  }

  const updateProfile = async (payload: { full_name?: string; email?: string; phone?: string; country?: string }) => {
    const data = await apiUpdateProfile(payload)
    if (data) {
      setUser({ id: data.id, email: data.email, name: data.name, phone: data.phone, country: data.country })
    }
    return data
  }

  const logout = () => {
    console.log('[Auth] Logging out...')
    // Clear all auth data and cookies
    setAccessToken(null)
    setIsAuthenticated(false)
    setUser(null)
    
    // Clear cookies with multiple methods
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax'
    document.cookie = 'access_token=; path=/; max-age=-1'
    document.cookie = 'access_token='
    
    // Call backend logout
    apiLogout()
    
    console.log('[Auth] Logout complete, redirecting...')
    // Detect if we're in admin area and redirect accordingly
    const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    const redirectUrl = isAdmin ? "/admin/login" : "/signin"
    
    // Redirect to login with hard refresh
    window.location.href = redirectUrl
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, updateProfile }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export default AuthProvider
