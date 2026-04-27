// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    // Custom login logic here
  })
})

// Custom command to connect wallet
Cypress.Commands.add('connectWallet', (walletType: 'metamask' | 'walletconnect' | 'coinbase' = 'metamask') => {
  // Mock wallet connection for E2E tests
  cy.window().then((win) => {
    // Mock ethereum object
    win.ethereum = {
      isMetaMask: walletType === 'metamask',
      isCoinbaseWallet: walletType === 'coinbase',
      request: cy.stub().as('ethereumRequest').resolves(['0x1234567890123456789012345678901234567890']),
      on: cy.stub(),
      removeListener: cy.stub(),
    }
  })
})

// Custom command to mock blockchain data
Cypress.Commands.add('mockBlockchainData', () => {
  cy.intercept('GET', '/api/properties*', { fixture: 'properties.json' }).as('getProperties')
  cy.intercept('GET', '/api/blockchain/*', { fixture: 'blockchain.json' }).as('getBlockchain')
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      connectWallet(walletType?: 'metamask' | 'walletconnect' | 'coinbase'): Chainable<void>
      mockBlockchainData(): Chainable<void>
    }
  }
}