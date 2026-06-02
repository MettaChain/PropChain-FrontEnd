import '@testing-library/cypress/add-commands'
import { mount } from '@cypress/react'
import React from 'react'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/config/wagmi'
import { ChainProvider } from '@/providers/ChainAwareProvider'
import { CartProvider } from '@/providers/CartProvider'
import { ComparisonProvider } from '@/providers/ComparisonProvider'
import { FavoritesProvider } from '@/providers/FavoritesProvider'
import { KycProvider } from '@/providers/KycProvider'
import { NotificationProvider } from '@/providers/NotificationProvider'
import { ReferralProvider } from '@/providers/ReferralProvider'
import { WalletProvider } from '@/providers/WalletProvider'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component.ts" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', (component, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const wrapped = (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <ChainProvider>
              <WalletProvider>
                <CartProvider>
                  <ComparisonProvider>
                    <FavoritesProvider>
                      <KycProvider>
                        <NotificationProvider>
                          <ReferralProvider>
                            {component}
                          </ReferralProvider>
                        </NotificationProvider>
                      </KycProvider>
                    </FavoritesProvider>
                  </ComparisonProvider>
                </CartProvider>
              </WalletProvider>
            </ChainProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  )

  return mount(wrapped, options)
})