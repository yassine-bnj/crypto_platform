const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface PriceHistoryItem {
  symbol: string
  name: string
  price_usd: string
  volume_24h: string
  market_cap: string
  price_change_percentage_1h: number
  price_change_percentage_24h: number
  price_change_percentage_7d: number
  timestamp: string
}

export interface OHLCItem {
  timestamp: string
  open: number
  close: number
  low: number
  high: number
}

export interface HeatmapItem {
  symbol: string
  name: string
  price: number
  percent_change_1h: number
  percent_change_24h: number
  percent_change_7d: number
  market_cap: number
}

export interface TechnicalIndicators {
  SMA_7?: number
  SMA_25?: number
  RSI?: number
  MACD?: number
  [key: string]: number | undefined
}

// Fetch price history data
export async function getPriceHistory(symbol: string, range = "7d") {
  try {
    const response = await fetch(`${API_BASE_URL}/price-history/${symbol}/?range=${range}`)
    if (!response.ok) throw new Error("Failed to fetch price history")
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching price history:", error)
    return null
  }
}

// Fetch OHLC data
export async function getOHLCData(symbol: string, interval = "1h", range = "24h") {
  try {
    const response = await fetch(`${API_BASE_URL}/ohlc/${symbol}/?interval=${interval}&range=${range}`)
    if (!response.ok) throw new Error("Failed to fetch OHLC data")
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching OHLC data:", error)
    return null
  }
}

// Fetch heatmap data
export async function getHeatmapData(range = "24h") {
  try {
    const response = await fetch(`${API_BASE_URL}/heatmap/?range=${range}`)
    if (!response.ok) throw new Error("Failed to fetch heatmap data")
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching heatmap data:", error)
    return null
  }
}

// Fetch technical indicators
export async function getIndicators(symbol: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/indicators/${symbol}/`)
    if (!response.ok) throw new Error("Failed to fetch indicators")
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching indicators:", error)
    return null
  }
}

// Transform price history to chart data
export function transformPriceHistoryToChart(data: PriceHistoryItem[]) {
  return data.map((item) => ({
    time: new Date(item.timestamp).toLocaleDateString(),
    price: Number.parseFloat(item.price_usd),
    volume: Number.parseFloat(item.volume_24h),
    change24h: item.price_change_percentage_24h,
  }))
}

// Transform OHLC data to candlestick format
export function transformOHLCToChart(data: OHLCItem[]) {
  return data.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    timestamp: item.timestamp,
  }))
}

// Transform heatmap data for display
export function transformHeatmapData(data: Record<string, HeatmapItem>) {
  return Object.values(data).map((item) => ({
    symbol: item.symbol,
    name: item.name,
    price: item.price,
    change24h: item.percent_change_24h,
    change1h: item.percent_change_1h,
    change7d: item.percent_change_7d,
    marketCap: item.market_cap,
  }))
}

// Change user password
export async function changePassword(current_password: string, new_password: string) {
  try {
    const response = await authFetch(`${API_BASE_URL}/auth/change-password/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ current_password, new_password }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data.detail || data.message || "Failed to change password"
      throw new Error(message)
    }

    return data
  } catch (error) {
    console.error("Error changing password:", error)
    throw error
  }
}

// Register new user
export async function register(name: string, email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data.detail || data.message || "Failed to register"
      throw new Error(message)
    }

    return data
  } catch (error) {
    console.error("Error registering user:", error)
    throw error
  }
}

// Login user
export async function login(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data.detail || data.message || "Failed to login"
      throw new Error(message)
    }

    // persist tokens (if returned)
    try {
      if (data.access) {
        localStorage.setItem("access_token", data.access)
      }
      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh)
      }
    } catch (e) {
      console.warn("Could not persist tokens", e)
    }

    return data
  } catch (error) {
    console.error("Error logging in:", error)
    throw error
  }
}

// Helper: get stored access token
export function getAccessToken() {
  try {
    return localStorage.getItem("access_token")
  } catch (e) {
    return null
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  } catch (e) {
    /* ignore */
  }
}

// Wrapper for fetch that adds Authorization header when access token present
export async function authFetch(input: RequestInfo, init?: RequestInit) {
  const token = getAccessToken()
  const headers = new Headers(init?.headers as HeadersInit || {})
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(input, { ...init, headers })
  return res
}
