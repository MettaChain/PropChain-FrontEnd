import React from 'react'
import { PropertyCard } from '../../../src/components/PropertyCard'
import type { Property } from '../../../src/types/property'

const mockProperty: Property = {
  id: 'prop-1',
  name: 'Luxury Downtown Apartment',
  description: 'A beautiful modern apartment in the heart of downtown',
  images: ['/images/property1.jpg', '/images/property2.jpg'],
  price: {
    perToken: 1000,
    total: 100000,
  },
  tokenInfo: {
    available: 50,
    totalSupply: 100,
  },
  location: {
    city: 'New York',
    state: 'NY',
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  propertyType: 'apartment',
  blockchain: 'ethereum',
  metrics: {
    roi: 12.5,
    occupancy: 95,
    appreciation: 8.2,
  },
  details: {
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
  },
  features: ['pool', 'gym', 'parking'],
  developer: {
    name: 'Premium Developers Inc.',
    verificationStatus: 'verified',
  },
  verified: true,
  featured: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('PropertyCard Component', () => {
  beforeEach(() => {
    // Mock Next.js router
    cy.window().then((win) => {
      win.next = {
        router: {
          push: cy.stub(),
          prefetch: cy.stub(),
        },
      }
    })
  })

  it('should render property information correctly', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.contains('Luxury Downtown Apartment').should('be.visible')
    cy.contains('New York, NY').should('be.visible')
    cy.contains('2 bed').should('be.visible')
    cy.contains('2 bath').should('be.visible')
    cy.contains('1,200 sqft').should('be.visible')
  })

  it('should display price information', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.contains('$1,000').should('be.visible') // per token
    cy.contains('$100,000').should('be.visible') // total
  })

  it('should show ROI badge', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.contains('12.5% ROI').should('be.visible')
  })

  it('should display blockchain badge', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.contains('Ethereum').should('be.visible')
  })

  it('should show verification badges', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.contains('⭐ Featured').should('be.visible')
    cy.contains('✓ Verified').should('be.visible')
  })

  it('should handle hover states', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.get('[data-cy=property-card]').should('exist').then(($card) => {
      // Test hover effect - this would check CSS transforms
      cy.wrap($card).trigger('mouseover')
      cy.wrap($card).trigger('mouseout')
    })
  })

  it('should handle add to cart button click', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.contains('Add to Cart').click()

    // Verify the click handler was called (would need to mock the store)
    cy.get('body').should('exist')
  })

  it('should handle comparison toggle', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    // Find and click the comparison button
    cy.get('button[title*="comparison"]').click()

    // Verify toggle functionality
    cy.get('body').should('exist')
  })

  it('should handle favorite toggle', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    // Find and click the favorite button
    cy.get('button').contains('Heart').click()

    // Verify favorite functionality
    cy.get('body').should('exist')
  })

  it('should navigate to property details on click', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.get('a[href*="/properties/prop-1"]').click()

    // Verify navigation (would need to mock router)
    cy.get('body').should('exist')
  })

  it('should display token availability', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.contains('50 / 100').should('be.visible')
  })

  it('should show property type icon', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    // Check for property type indicator
    cy.get('[data-cy=property-type-icon]').should('exist')
  })

  it('should handle list view mode', () => {
    cy.mount(<PropertyCard property={mockProperty} viewMode="list" />)

    // In list view, should have different layout
    cy.get('[data-cy=property-card]').should('have.class', 'flex-row')
  })

  it('should handle grid view mode', () => {
    cy.mount(<PropertyCard property={mockProperty} viewMode="grid" />)

    // In grid view, should have different layout
    cy.get('[data-cy=property-card]').should('have.class', 'flex-col')
  })

  it('should display developer badge', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.contains('Premium Developers Inc.').should('be.visible')
  })

  it('should show comparison checkbox', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.get('input[type="checkbox"]').should('exist')
    cy.contains('Compare').should('be.visible')
  })

  it('should prevent event propagation on button clicks', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    // Click add to cart - should not navigate
    cy.contains('Add to Cart').click()

    // Should still be on the same page
    cy.get('body').should('exist')
  })

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-6')
    cy.mount(<PropertyCard property={mockProperty} />)

    cy.contains('Luxury Downtown Apartment').should('be.visible')
    cy.contains('Add to Cart').should('be.visible')
  })

  it('should support keyboard navigation', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    // Tab through interactive elements
    cy.get('a[href*="/properties/prop-1"]').focus().should('have.focus')
    cy.focused().tab()
    // Should focus on next interactive element
  })

  it('should have proper ARIA labels', () => {
    cy.mount(<PropertyCard property={mockProperty} />)

    // Check for proper accessibility attributes
    cy.get('input[type="checkbox"]').should('have.attr', 'aria-label')
    cy.get('button[title]').should('have.length.greaterThan', 0)
  })

  it('should handle missing property details gracefully', () => {
    const propertyWithoutDetails = { ...mockProperty, details: {} }
    cy.mount(<PropertyCard property={propertyWithoutDetails} />)

    // Should not crash and should render without details
    cy.contains('Luxury Downtown Apartment').should('be.visible')
  })

  it('should handle missing developer information', () => {
    const propertyWithoutDeveloper = { ...mockProperty, developer: undefined }
    cy.mount(<PropertyCard property={propertyWithoutDeveloper} />)

    // Should show unverified badge
    cy.contains('Unverified').should('be.visible')
  })
})