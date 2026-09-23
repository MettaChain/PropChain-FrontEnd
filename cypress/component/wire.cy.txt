import React from 'react'
import { TransactionConfirmation } from '../../../src/components/TransactionConfirmation'

const mockTransaction = {
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
  value: '1000000000000000000', // 1 ETH in wei
  data: '0xa9059cbb00000000000000000000000012345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000001',
  gasLimit: '21000',
  gasPrice: '20000000000',
}

describe('TransactionConfirmation Component', () => {
  beforeEach(() => {
    // Mock security validation
    cy.window().then((win) => {
      win.localStorage = {
        getItem: cy.stub().returns(null),
        setItem: cy.stub(),
        removeItem: cy.stub(),
        clear: cy.stub(),
      }
    })
  })

  it('should render transaction confirmation modal', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    cy.contains('Transaction Confirmation').should('be.visible')
    cy.contains('0x742d...4Db45').should('be.visible')
    cy.contains('1.00 ETH').should('be.visible')
  })

  it('should show security validation status', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Should show security validation results
    cy.get('[data-cy=security-status]').should('exist')
  })

  it('should display transaction details', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    cy.contains('Show Details').click()
    cy.contains('Gas Limit').should('be.visible')
    cy.contains('Gas Price').should('be.visible')
  })

  it('should handle TOTP verification', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Enter TOTP code
    cy.get('input[placeholder*="6-digit"]').type('123456')

    // Should enable confirm button when code is entered
    cy.get('button').contains('Confirm Transaction').should('not.be.disabled')
  })

  it('should handle hardware wallet verification', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Switch to hardware tab
    cy.contains('Hardware').click()

    // Should show hardware wallet instructions
    cy.contains('hardware wallet').should('be.visible')
  })

  it('should show KYC requirements for large transactions', () => {
    const largeTransaction = {
      ...mockTransaction,
      value: '10000000000000000000000', // 10,000 ETH
    }

    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={largeTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    cy.contains('KYC Required').should('be.visible')
  })

  it('should handle transaction confirmation', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Enter verification code
    cy.get('input[placeholder*="6-digit"]').type('123456')

    // Click confirm
    cy.get('button').contains('Confirm Transaction').click()

    // Should call onConfirm
    cy.wrap(onConfirm).should('have.been.called')
  })

  it('should handle transaction cancellation', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Click cancel
    cy.get('button').contains('Cancel').click()

    // Should call onCancel
    cy.wrap(onCancel).should('have.been.called')
  })

  it('should show loading state during confirmation', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
        loading={true}
      />
    )

    cy.contains('Confirming...').should('be.visible')
    cy.get('button').contains('Confirm Transaction').should('be.disabled')
  })

  it('should validate TOTP code format', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Try invalid code
    cy.get('input[placeholder*="6-digit"]').type('12345') // 5 digits

    // Confirm button should be disabled
    cy.get('button').contains('Confirm Transaction').should('be.disabled')

    // Enter valid code
    cy.get('input[placeholder*="6-digit"]').type('6') // Now 6 digits

    // Confirm button should be enabled
    cy.get('button').contains('Confirm Transaction').should('not.be.disabled')
  })

  it('should show raw transaction data', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    cy.contains('Show Raw Data').click()
    cy.contains('0xa9059cbb').should('be.visible')
  })

  it('should handle trust device option', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Check trust device checkbox
    cy.get('input[type="checkbox"]').check()

    // Should remember the setting
    cy.get('input[type="checkbox"]').should('be.checked')
  })

  it('should display security warnings for high-risk transactions', () => {
    const highRiskTransaction = {
      ...mockTransaction,
      to: '0x0000000000000000000000000000000000000000', // Known risky address
    }

    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={highRiskTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    cy.contains('Security Warning').should('be.visible')
    cy.contains('high risk').should('be.visible')
  })

  it('should be accessible with keyboard navigation', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Test tab navigation
    cy.get('button').first().focus().should('have.focus')
    cy.focused().tab()
    cy.focused().tab()
  })

  it('should handle modal close on escape key', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Press escape
    cy.get('body').type('{esc}')

    // Should call onCancel
    cy.wrap(onCancel).should('have.been.called')
  })

  it('should show step-up security for large amounts', () => {
    const largeTransaction = {
      ...mockTransaction,
      value: '1000000000000000000000', // 1000 ETH
    }

    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={largeTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    cy.contains('Enhanced Security Required').should('be.visible')
  })

  it('should display transaction fee estimates', () => {
    const onConfirm = cy.stub()
    const onCancel = cy.stub()

    cy.mount(
      <TransactionConfirmation
        isOpen={true}
        transaction={mockTransaction}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    cy.contains('Show Details').click()
    cy.contains('Estimated Fee').should('be.visible')
  })
})