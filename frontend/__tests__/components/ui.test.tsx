/**
 * Tests pour les composants UI principaux
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

describe('UI Components', () => {
  describe('Button', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('should handle click events', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click</Button>)
      
      screen.getByText('Click').click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should support different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>)
      expect(screen.getByText('Default')).toBeInTheDocument()

      rerender(<Button variant="destructive">Delete</Button>)
      expect(screen.getByText('Delete')).toBeInTheDocument()

      rerender(<Button variant="outline">Outline</Button>)
      expect(screen.getByText('Outline')).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByText('Disabled')
      expect(button).toBeDisabled()
    })
  })

  describe('Card', () => {
    it('should render card with title and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content goes here</CardContent>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card content goes here')).toBeInTheDocument()
    })
  })

  describe('Badge', () => {
    it('should render badge with text', () => {
      render(<Badge>New</Badge>)
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('should support different variants', () => {
      const { rerender } = render(<Badge variant="default">Default</Badge>)
      expect(screen.getByText('Default')).toBeInTheDocument()

      rerender(<Badge variant="secondary">Secondary</Badge>)
      expect(screen.getByText('Secondary')).toBeInTheDocument()

      rerender(<Badge variant="destructive">Error</Badge>)
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })
})
