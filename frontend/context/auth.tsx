"use client"

import React from "react"
import { login as apiLogin, adminLogin as apiAdminLogin, logout as apiLogout, getAccessToken, setAccessToken, authFetch, API_BASE_URL, updateProfile as apiUpdateProfile } from "@/lib/api-service"

type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  adminLogin: (email: string, password: string) => Promise<void>
  logout: () => void
  user?: { id: number; email: string; name?: string; phone?: string; country?: string; is_staff?: boolean; is_superuser?: boolean } | null
  updateProfile: (payload: { full_name?: string; email?: string; phone?: string; country?: string }) => Promise<any>
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false)
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [user, setUser] = React.useState<{ id: number; email: string; name?: string; phone?: string; country?: string; is_staff?: boolean; is_superuser?: boolean } | null>(null)

  // try to refresh access token from httpOnly cookie on mount
  React.useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        console.log('[Auth] Attempting to refresh token from httpOnly cookie...')
        const rr = await fetch(`${API_BASE_URL}/auth/refresh/`, { 
          method: 'POST', 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        console.log('[Auth] Refresh response status:', rr.status)
        
        if (rr.ok) {
          const data = await rr.json().catch(() => ({}))
          console.log('[Auth] Refresh successful, got token:', !!data.access)
          
          if (data.access) {
            setAccessToken(data.access)
            // Set cookie for middleware access
            document.cookie = `access_token=${data.access}; path=/; max-age=3600; SameSite=Lax`
            if (mounted) setIsAuthenticated(true)
            
            // fetch profile
            try {
              const meRes = await authFetch(`${API_BASE_URL}/auth/me/`, { method: 'GET' })
              console.log('[Auth] Me response:', meRes.status)
              if (meRes.ok) {
                const me = await meRes.json().catch(() => null)
                console.log('[Auth] User data from refresh:', me)
                if (me && mounted) setUser(me)
              } else {
                console.error('[Auth] Me request failed:', meRes.status)
              }
            } catch (e) {
              console.error('[Auth] Error fetching user data:', e)
            }
          }
        } else {
          const errorData = await rr.json().catch(() => ({}))
          console.log('[Auth] Refresh failed, status:', rr.status, 'detail:', errorData.detail || errorData)
          // Mark that we tried to refresh and failed (don't try again)
          if (mounted) setIsAuthenticated(false)
        }
      } catch (e) {
        console.error('[Auth] Error during refresh:', e)
        if (mounted) setIsAuthenticated(false)
      } finally {
        // Always set loading to false when done
        if (mounted) setIsLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  const login = async (email: string, password: string) => {
    console.log('[Auth] Login attempt:', email)
    setIsLoading(true)
    try {
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
    } finally {
      setIsLoading(false)
    }
  }

  const adminLogin = async (email: string, password: string) => {
    console.log('[Auth] Admin login attempt:', email)
    setIsLoading(true)
    try {
      const data = await apiAdminLogin(email, password)
      console.log('[Auth] Admin login response:', data)
      if (data?.access) {
        setAccessToken(data.access)
        setIsAuthenticated(true)
        console.log('[Auth] Admin token set, fetching user...')
        try {
          const meRes = await authFetch(`${API_BASE_URL}/auth/me/`, { method: 'GET' })
          console.log('[Auth] Admin me response:', meRes.status)
          if (meRes.ok) {
            const me = await meRes.json().catch(() => null)
            console.log('[Auth] Admin user data:', me)
            setUser(me)
          }
        } catch (e) {
          console.error('[Auth] Admin me fetch error:', e)
        }
      } else {
        console.error('[Auth] No access token in admin response')
      }
    } finally {
      setIsLoading(false)
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
    console.log('[Auth] Current user:', user)
    console.log('[Auth] Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'N/A')
    
    // Determine redirect URL based on user role or current route
    const isAdminUser = user?.is_staff || user?.is_superuser
    const isAdminRoute = typeof window !== 'undefined' && (window.location.pathname.includes('/admin') || window.location.pathname.startsWith('/admin'))
    
    console.log('[Auth] isAdminUser:', isAdminUser)
    console.log('[Auth] isAdminRoute:', isAdminRoute)
    
    const redirectUrl = (isAdminUser || isAdminRoute) ? "/admin/login" : "/signin"
    console.log('[Auth] Redirect URL:', redirectUrl)
    
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
    
    console.log('[Auth] Logout complete, redirecting to:', redirectUrl)
    
    // Redirect to login with hard refresh
    window.location.href = redirectUrl
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, adminLogin, logout, user, updateProfile }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export default AuthProvider
