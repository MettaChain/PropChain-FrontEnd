import { ErrorCategory } from '@/types/errors'

export interface RouteErrorIconConfig {
  bgClass: string
  iconClass: string
}

export const getRouteErrorIconConfig = (category: ErrorCategory): RouteErrorIconConfig => {
  switch (category) {
    case ErrorCategory.WEB3:
      return {
        bgClass: 'bg-orange-100 dark:bg-orange-900/20',
        iconClass: 'text-orange-600 dark:text-orange-400',
      }
    case ErrorCategory.NETWORK:
      return {
        bgClass: 'bg-red-100 dark:bg-red-900/20',
        iconClass: 'text-red-600 dark:text-red-400',
      }
    default:
      return {
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        iconClass: 'text-gray-600 dark:text-gray-400',
      }
  }
}

export const getRouteErrorTitle = (category: ErrorCategory): string => {
  switch (category) {
    case ErrorCategory.WEB3:
      return 'Wallet Connection Error'
    case ErrorCategory.NETWORK:
      return 'Network Error'
    case ErrorCategory.VALIDATION:
      return 'Validation Error'
    case ErrorCategory.PERMISSION:
      return 'Permission Error'
    case ErrorCategory.AUTHENTICATION:
      return 'Authentication Error'
    default:
      return 'Something went wrong'
  }
}
