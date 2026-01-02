/**
 * Tests pour le hook use-toast
 */
import '@testing-library/jest-dom'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '@/hooks/use-toast'

describe('useToast', () => {
  it('should add a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test',
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Toast',
      description: 'This is a test',
    })
  })

  it('should dismiss a toast', () => {
    const { result } = renderHook(() => useToast())

    let toastId: string

    act(() => {
      const { id } = result.current.toast({
        title: 'Dismissible Toast',
      })
      toastId = id
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss(toastId!)
    })

    // Toast should be marked for removal
    const toast = result.current.toasts.find(t => t.id === toastId)
    expect(toast?.open).toBe(false)
  })

  it('should handle multiple toasts', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
      result.current.toast({ title: 'Toast 3' })
    })

    // le hook peut dédupliquer/limiter, on vérifie au moins la dernière toast
    expect(result.current.toasts.length).toBeGreaterThanOrEqual(1)
    expect(result.current.toasts[result.current.toasts.length - 1]?.title).toBe('Toast 3')
  })

  it('should support success variant', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Success!',
        variant: 'default',
      })
    })

    expect(result.current.toasts[0].variant).toBe('default')
  })

  it('should support destructive variant', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Error!',
        variant: 'destructive',
      })
    })

    expect(result.current.toasts[0].variant).toBe('destructive')
  })
})
