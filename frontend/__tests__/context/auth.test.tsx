/**
 * Tests pour le AuthContext
 * Couvre: login, logout, token management
 */
import '@testing-library/jest-dom'
import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/context/auth'
import { getAccessToken } from '@/lib/api-service'

// Mock fetch (par défaut succès vide)
const mockFetch = jest.fn()
global.fetch = mockFetch as any

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('should login successfully', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    }
    const mockResponse = {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      user: mockUser,
    }

    let meCalls = 0
    mockFetch.mockImplementation((url: RequestInfo) => {
      if (typeof url === 'string' && url.includes('/auth/refresh/')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ access: 'init-token' }) })
      }
      if (typeof url === 'string' && url.includes('/auth/login/')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => mockResponse })
      }
      if (typeof url === 'string' && url.includes('/auth/me/')) {
        meCalls += 1
        return Promise.resolve({ ok: true, status: 200, json: async () => mockUser })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for initial refresh effect to settle
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.login('test@example.com', 'password123')
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    expect(getAccessToken()).toBe('mock-access-token')
    expect(meCalls).toBeGreaterThanOrEqual(1)
  })

  it('should handle login error', async () => {
    mockFetch.mockImplementation((url: RequestInfo) => {
      if (typeof url === 'string' && url.includes('/auth/login/')) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({ detail: 'Invalid credentials' }) })
      }
      // refresh/me defaults
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await expect(
        result.current.login('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow()
    })

    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  it('should logout successfully', async () => {
    // Setup: user is logged in
    localStorageMock.setItem('token', 'test-token')
    // éviter l'erreur jsdom sur navigation
    delete (window as any).location
    ;(window as any).location = { href: '/', pathname: '/', assign: jest.fn() }

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Mock the logout API call
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ detail: 'Logged out' }) })

    await act(async () => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should restore user from token on mount', async () => {
    localStorageMock.setItem('token', 'existing-token')

    const mockUser = {
      id: 1,
      username: 'existinguser',
      email: 'existing@example.com',
    }

    mockFetch.mockImplementation((url: RequestInfo) => {
      if (typeof url === 'string' && url.includes('/auth/refresh/')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ access: 'existing-token' }) })
      }
      if (typeof url === 'string' && url.includes('/auth/me/')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => mockUser })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})
