import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { ErrorTestSuite } from '@/components/error/ErrorTestSuite'

describe('ErrorTestSuite', () => {
  it('renders the test suite and instructions', () => {
    render(<ErrorTestSuite />)

    expect(screen.getByRole('heading', { name: /Error Boundary Test Suite/i })).toBeInTheDocument()
    expect(screen.getByText(/Test different error scenarios to verify error boundary functionality/i)).toBeInTheDocument()
    expect(screen.getByText(/How to use:/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Test Error/i }).length).toBeGreaterThan(0)
  })

  it('updates scenario status after running a test', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ delay: null })

    render(<ErrorTestSuite />)

    const firstTestButton = screen.getAllByRole('button', { name: /Test Error/i })[0]
    await user.click(firstTestButton)

    expect(firstTestButton).toBeDisabled()
    expect(screen.getByText(/Running.../i)).toBeInTheDocument()
    expect(await screen.findByText(/CAUGHT/i)).toBeInTheDocument()

    jest.runAllTimers()
    await waitFor(() => expect(firstTestButton).not.toBeDisabled())
    jest.useRealTimers()
  })

  it('shows and clears the summary panel after a test run', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ delay: null })

    render(<ErrorTestSuite />)

    await user.click(screen.getAllByRole('button', { name: /Test Error/i })[0])
    expect(await screen.findByText(/CAUGHT/i)).toBeInTheDocument()
    expect(screen.getByText(/Test Results/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Clear Results/i }))

    expect(screen.queryByText(/Test Results/i)).not.toBeInTheDocument()
    jest.useRealTimers()
  })
})
