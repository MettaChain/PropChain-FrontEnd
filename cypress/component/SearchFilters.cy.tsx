import React from 'react'
import { SearchFilterForm } from '../../../src/components/forms/SearchFilterForm'
import { DEFAULT_FILTERS, type SearchFilters } from '../../../src/types/property'

const mockFilters: SearchFilters = {
  ...DEFAULT_FILTERS,
  query: 'downtown',
  priceRange: [100000, 500000],
  propertyTypes: ['apartment', 'house'],
  blockchains: ['ethereum', 'polygon'],
  roiMin: 5,
  roiMax: 15,
  location: 'New York',
  bedrooms: [2, 3],
  bathrooms: [1, 2],
  squareFeetRange: [800, 2000],
  status: ['available'],
}

describe('SearchFilterForm Component', () => {
  beforeEach(() => {
    // Mock form submission
    cy.window().then((win) => {
      win.localStorage = {
        getItem: cy.stub().returns(null),
        setItem: cy.stub(),
        removeItem: cy.stub(),
        clear: cy.stub(),
      }
    })
  })

  it('should render search filter form with all fields', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    cy.contains('Search Properties').should('be.visible')
    cy.contains('Filter settings').should('be.visible')
    cy.get('input[placeholder*="Search properties"]').should('be.visible')
    cy.contains('Apply filters').should('be.visible')
    cy.contains('Clear filters').should('be.visible')
  })

  it('should populate form with existing filters', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={mockFilters}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    cy.get('input[placeholder*="Search properties"]').should('have.value', 'downtown')
    cy.get('input[name="priceMin"]').should('have.value', '100000')
    cy.get('input[name="priceMax"]').should('have.value', '500000')
    cy.get('input[name="roiMin"]').should('have.value', '5')
    cy.get('input[name="roiMax"]').should('have.value', '15')
    cy.get('input[name="location"]').should('have.value', 'New York')
  })

  it('should handle search query input', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    cy.get('input[placeholder*="Search properties"]').type('luxury apartment')
    cy.get('input[placeholder*="Search properties"]').should('have.value', 'luxury apartment')
  })

  it('should handle price range inputs', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    cy.get('input[name="priceMin"]').type('200000')
    cy.get('input[name="priceMax"]').type('800000')

    cy.get('input[name="priceMin"]').should('have.value', '200000')
    cy.get('input[name="priceMax"]').should('have.value', '800000')
  })

  it('should handle ROI range inputs', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    cy.get('input[name="roiMin"]').type('8')
    cy.get('input[name="roiMax"]').type('20')

    cy.get('input[name="roiMin"]').should('have.value', '8')
    cy.get('input[name="roiMax"]').should('have.value', '20')
  })

  it('should handle location input', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    cy.get('input[name="location"]').type('San Francisco, CA')
    cy.get('input[name="location"]').should('have.value', 'San Francisco, CA')
  })

  it('should handle property type checkboxes', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Check apartment
    cy.contains('Apartment').find('input[type="checkbox"]').check()
    cy.contains('Apartment').find('input[type="checkbox"]').should('be.checked')

    // Check house
    cy.contains('House').find('input[type="checkbox"]').check()
    cy.contains('House').find('input[type="checkbox"]').should('be.checked')

    // Uncheck apartment
    cy.contains('Apartment').find('input[type="checkbox"]').uncheck()
    cy.contains('Apartment').find('input[type="checkbox"]').should('not.be.checked')
  })

  it('should handle blockchain checkboxes', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Check Ethereum
    cy.contains('Ethereum').find('input[type="checkbox"]').check()
    cy.contains('Ethereum').find('input[type="checkbox"]').should('be.checked')

    // Check Polygon
    cy.contains('Polygon').find('input[type="checkbox"]').check()
    cy.contains('Polygon').find('input[type="checkbox"]').should('be.checked')
  })

  it('should handle bedroom checkboxes', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Check 2+ bedrooms
    cy.contains('2+').find('input[type="checkbox"]').first().check()
    cy.contains('2+').find('input[type="checkbox"]').first().should('be.checked')

    // Check 3+ bedrooms
    cy.contains('3+').find('input[type="checkbox"]').first().check()
    cy.contains('3+').find('input[type="checkbox"]').first().should('be.checked')
  })

  it('should handle bathroom checkboxes', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Check 1+ bathrooms
    cy.contains('1+').find('input[type="checkbox"]').last().check()
    cy.contains('1+').find('input[type="checkbox"]').last().should('be.checked')

    // Check 2+ bathrooms
    cy.contains('2+').find('input[type="checkbox"]').last().check()
    cy.contains('2+').find('input[type="checkbox"]').last().should('be.checked')
  })

  it('should handle square feet range inputs', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    cy.get('input[name="squareFeetMin"]').type('1000')
    cy.get('input[name="squareFeetMax"]').type('3000')

    cy.get('input[name="squareFeetMin"]').should('have.value', '1000')
    cy.get('input[name="squareFeetMax"]').should('have.value', '3000')
  })

  it('should handle status checkboxes', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Check available
    cy.contains('available').find('input[type="checkbox"]').check()
    cy.contains('available').find('input[type="checkbox"]').should('be.checked')
  })

  it('should submit form with applied filters', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Fill out form
    cy.get('input[placeholder*="Search properties"]').type('test query')
    cy.get('input[name="priceMin"]').type('150000')
    cy.get('input[name="priceMax"]').type('600000')
    cy.contains('Apartment').find('input[type="checkbox"]').check()
    cy.contains('Ethereum').find('input[type="checkbox"]').check()

    // Submit form
    cy.contains('Apply filters').click()

    // Should call onApplyFilters with correct data
    cy.wrap(onApplyFilters).should('have.been.called')
  })

  it('should clear all filters', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={mockFilters}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Click clear filters
    cy.contains('Clear filters').click()

    // Should call onClearFilters
    cy.wrap(onClearFilters).should('have.been.called')

    // Form should be reset to default values
    cy.get('input[placeholder*="Search properties"]').should('have.value', '')
  })

  it('should validate price range (min <= max)', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Set invalid range (min > max)
    cy.get('input[name="priceMin"]').type('500000')
    cy.get('input[name="priceMax"]').type('200000')

    // Try to submit
    cy.contains('Apply filters').click()

    // Should show validation error
    cy.contains('Maximum price must be greater than minimum price').should('be.visible')
  })

  it('should validate ROI range (min <= max)', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Set invalid ROI range
    cy.get('input[name="roiMin"]').type('20')
    cy.get('input[name="roiMax"]').type('10')

    cy.contains('Apply filters').click()

    // Should show validation error
    cy.contains('Maximum ROI must be greater than minimum ROI').should('be.visible')
  })

  it('should validate square feet range (min <= max)', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Set invalid square feet range
    cy.get('input[name="squareFeetMin"]').type('2000')
    cy.get('input[name="squareFeetMax"]').type('1000')

    cy.contains('Apply filters').click()

    // Should show validation error
    cy.contains('Maximum square feet must be greater than minimum square feet').should('be.visible')
  })

  it('should handle form reset when filters prop changes', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Fill out form
    cy.get('input[placeholder*="Search properties"]').type('test query')

    // Remount with different filters
    cy.mount(
      <SearchFilterForm
        filters={mockFilters}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Form should be updated with new filter values
    cy.get('input[placeholder*="Search properties"]').should('have.value', 'downtown')
  })

  it('should be responsive on mobile', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.viewport('iphone-6')

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Should stack columns on mobile
    cy.get('.lg\\:grid-cols-\\[1fr_320px\\]').should('exist')
  })

  it('should handle keyboard navigation', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Test tab navigation through form fields
    cy.get('input[placeholder*="Search properties"]').focus().should('have.focus')
    cy.focused().tab()
    cy.focused().tab()
  })

  it('should show form descriptions', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    cy.contains('Type at least 2 characters to narrow down results.').should('be.visible')
  })

  it('should handle multiple property type selections', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Select multiple property types
    cy.contains('Apartment').find('input[type="checkbox"]').check()
    cy.contains('House').find('input[type="checkbox"]').check()
    cy.contains('Condo').find('input[type="checkbox"]').check()

    // All should be checked
    cy.contains('Apartment').find('input[type="checkbox"]').should('be.checked')
    cy.contains('House').find('input[type="checkbox"]').should('be.checked')
    cy.contains('Condo').find('input[type="checkbox"]').should('be.checked')
  })

  it('should handle multiple blockchain selections', () => {
    const onApplyFilters = cy.stub()
    const onClearFilters = cy.stub()

    cy.mount(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
      />
    )

    // Select multiple blockchains
    cy.contains('Ethereum').find('input[type="checkbox"]').check()
    cy.contains('Polygon').find('input[type="checkbox"]').check()
    cy.contains('Arbitrum').find('input[type="checkbox"]').check()

    // All should be checked
    cy.contains('Ethereum').find('input[type="checkbox"]').should('be.checked')
    cy.contains('Polygon').find('input[type="checkbox"]').should('be.checked')
    cy.contains('Arbitrum').find('input[type="checkbox"]').should('be.checked')
  })
})