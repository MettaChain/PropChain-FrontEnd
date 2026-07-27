import { ErrorCategory } from '@/types/errors'
import { getRouteErrorIconConfig, getRouteErrorTitle } from '@/components/error/routeErrorHelpers'

describe('routeErrorHelpers', () => {
  describe('getRouteErrorTitle', () => {
    it('returns the expected title for WEB3 errors', () => {
      expect(getRouteErrorTitle(ErrorCategory.WEB3)).toBe('Wallet Connection Error')
    })

    it('returns the expected title for NETWORK errors', () => {
      expect(getRouteErrorTitle(ErrorCategory.NETWORK)).toBe('Network Error')
    })

    it('returns a fallback title for unknown error categories', () => {
      expect(getRouteErrorTitle(ErrorCategory.UNKNOWN)).toBe('Something went wrong')
    })
  })

  describe('getRouteErrorIconConfig', () => {
    it('returns orange styling for WEB3 errors', () => {
      expect(getRouteErrorIconConfig(ErrorCategory.WEB3)).toEqual({
        bgClass: 'bg-orange-100 dark:bg-orange-900/20',
        iconClass: 'text-orange-600 dark:text-orange-400',
      })
    })

    it('returns red styling for NETWORK errors', () => {
      expect(getRouteErrorIconConfig(ErrorCategory.NETWORK)).toEqual({
        bgClass: 'bg-red-100 dark:bg-red-900/20',
        iconClass: 'text-red-600 dark:text-red-400',
      })
    })

    it('returns neutral styling for unknown categories', () => {
      expect(getRouteErrorIconConfig(ErrorCategory.UNKNOWN)).toEqual({
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        iconClass: 'text-gray-600 dark:text-gray-400',
      })
    })
  })
})
