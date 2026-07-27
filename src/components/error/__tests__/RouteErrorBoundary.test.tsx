const pushMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary'
import { ErrorCategory, ErrorSeverity, type AppError } from '@/types/errors'

describe('RouteErrorBoundary', () => {
  const resetError = jest.fn()
  const mockError = {
    id: 'error-123',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    message: 'Unable to reach the network',
    userMessage: 'Cannot reach network at this time.',
    timestamp: new Date(),
    context: { endpoint: '/properties' },
    isRecoverable: false,
    shouldReport: true,
  } as AppError

  beforeEach(() => {
    pushMock.mockClear()
    resetError.mockClear()
  })

  it('renders the expected error UI for a network error', () => {
    render(<RouteErrorBoundary error={mockError} routeName="Properties" resetError={resetError} />)

    expect(screen.getByRole('heading', { name: /Network Error/i })).toBeInTheDocument()
    expect(screen.getByText(/Cannot reach network at this time./i)).toBeInTheDocument()
    expect(screen.getByText(/Error in:/i)).toBeInTheDocument()
    expect(screen.getByText('Properties')).toBeInTheDocument()
    expect(screen.getByText(/Error Details/i)).toBeInTheDocument()
  })

  it('calls resetError when the retry button is clicked', async () => {
    render(<RouteErrorBoundary error={mockError} routeName="Properties" resetError={resetError} />)

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(resetError).toHaveBeenCalledTimes(1)
  })

  it('navigates home and resets the error when the home button is clicked', async () => {
    render(<RouteErrorBoundary error={mockError} routeName="Properties" resetError={resetError} />)

    await userEvent.click(screen.getByRole('button', { name: /go home/i }))

    expect(pushMock).toHaveBeenCalledWith('/')
    expect(resetError).toHaveBeenCalledTimes(1)
  })
})
