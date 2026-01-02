/**
 * Tests pour le service API
 * Couvre: les appels fetch, gestion d'erreurs, authentification
 */
import '@testing-library/jest-dom'
import { apiService } from '@/lib/api-service'

// Mock global fetch
global.fetch = jest.fn()

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  describe('Authentication', () => {
    it('should include auth token in request headers', async () => {
      localStorage.setItem('token', 'test-token-123')
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      })

      await apiService.get('/test-endpoint')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      )
    })

    it('should work without auth token', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      })

      await apiService.get('/test-endpoint')

      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('GET requests', () => {
    it('should fetch data successfully', async () => {
      const mockData = { assets: ['BTC', 'ETH'] }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await apiService.get('/assets')

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/assets'),
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should handle 404 errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      })

      await expect(apiService.get('/nonexistent')).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(apiService.get('/test')).rejects.toThrow('Network error')
    })
  })

  describe('POST requests', () => {
    it('should send data successfully', async () => {
      const mockResponse = { id: 1, created: true }
      const postData = { name: 'Bitcoin', symbol: 'BTC' }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiService.post('/assets', postData)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should handle validation errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid data' }),
      })

      await expect(
        apiService.post('/assets', { invalid: 'data' })
      ).rejects.toThrow()
    })
  })

  describe('Price History', () => {
    it('should fetch price history with range parameter', async () => {
      const mockPrices = [
        { price_usd: '50000', timestamp: '2026-01-09T10:00:00Z' },
        { price_usd: '51000', timestamp: '2026-01-09T11:00:00Z' },
      ]
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPrices,
      })

      const result = await apiService.get('/price-history/BTC/?range=24h')

      expect(result).toEqual(mockPrices)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('price-history/BTC'),
        expect.any(Object)
      )
    })
  })

  describe('Heatmap', () => {
    it('should fetch market heatmap data', async () => {
      const mockHeatmap = {
        BTC: { symbol: 'BTC', price: 50000, percent_change_24h: 2.3 },
        ETH: { symbol: 'ETH', price: 3000, percent_change_24h: 1.5 },
      }
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHeatmap,
      })

      const result = await apiService.get('/heatmap/?range=24h')

      expect(result).toEqual(mockHeatmap)
      expect(Object.keys(result)).toContain('BTC')
      expect(Object.keys(result)).toContain('ETH')
    })
  })
})
