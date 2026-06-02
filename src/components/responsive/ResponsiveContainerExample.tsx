/**
 * ResponsiveContainer Usage Examples
 *
 * Demonstrates various use cases for the ResponsiveContainer component,
 * including accessibility best-practices (semantic elements, ARIA labels).
 */

'use client';

import React from 'react';
import { ResponsiveContainer, ResponsiveContainerFluid } from './ResponsiveContainer';

/**
 * Basic usage example
 */
export function BasicContainerExample() {
  return (
    <ResponsiveContainer>
      <h1 className="text-2xl font-bold mb-4">Welcome to PropChain</h1>
      <p className="text-gray-700">
        This content has responsive padding that adapts to your screen size.
        On mobile (16px), tablet (24px), and desktop (32px).
      </p>
    </ResponsiveContainer>
  );
}

/**
 * Container with custom styling
 */
export function StyledContainerExample() {
  return (
    <ResponsiveContainer
      as="section"
      aria-labelledby="property-details-heading"
      className="bg-gray-100 rounded-lg shadow-md"
    >
      <h2 id="property-details-heading" className="text-xl font-semibold mb-2">
        Property Details
      </h2>
      <div className="space-y-2">
        <p><strong>Location:</strong> San Francisco, CA</p>
        <p><strong>Price:</strong> $1,200,000</p>
        <p><strong>Bedrooms:</strong> 3</p>
        <p><strong>Bathrooms:</strong> 2</p>
      </div>
    </ResponsiveContainer>
  );
}

/**
 * Nested containers example
 */
export function NestedContainersExample() {
  return (
    <ResponsiveContainer
      as="section"
      aria-labelledby="dashboard-heading"
      className="bg-blue-50"
    >
      <h2 id="dashboard-heading" className="text-xl font-bold mb-4">
        Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResponsiveContainer
          as="section"
          aria-labelledby="stats-heading"
          className="bg-white rounded-lg shadow"
        >
          <h3 id="stats-heading" className="font-semibold mb-2">Statistics</h3>
          <p>Total Properties: 42</p>
        </ResponsiveContainer>

        <ResponsiveContainer
          as="section"
          aria-labelledby="activity-heading"
          className="bg-white rounded-lg shadow"
        >
          <h3 id="activity-heading" className="font-semibold mb-2">
            Recent Activity
          </h3>
          <p>Last updated: 5 minutes ago</p>
        </ResponsiveContainer>
      </div>
    </ResponsiveContainer>
  );
}

/**
 * Fluid container example with smooth scaling
 */
export function FluidContainerExample() {
  return (
    <ResponsiveContainerFluid
      as="section"
      aria-labelledby="fluid-heading"
      className="bg-gradient-to-r from-purple-100 to-pink-100"
    >
      <h2 id="fluid-heading" className="text-xl font-bold mb-4">
        Fluid Padding Container
      </h2>
      <p className="text-gray-700">
        This container uses CSS clamp() for smooth, fluid padding that scales
        continuously with the viewport width. Resize your browser to see the
        effect!
      </p>
      <p className="text-sm text-gray-600 mt-2">
        Padding scales from 16px to 32px using: clamp(16px, 4vw, 32px)
      </p>
    </ResponsiveContainerFluid>
  );
}

/**
 * Full page layout example — uses semantic landmark elements throughout
 */
export function PageLayoutExample() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header landmark */}
      <ResponsiveContainer as="header" className="bg-white border-b">
        <div className="py-4">
          <p className="text-2xl font-bold">PropChain</p>
          {/* Navigation landmark with descriptive label */}
          <nav aria-label="Primary navigation" className="mt-2">
            <a href="/home" className="mr-4 text-blue-600">
              Home
            </a>
            <a href="/properties" className="mr-4 text-blue-600">
              Properties
            </a>
            <a href="/about" className="mr-4 text-blue-600">
              About
            </a>
          </nav>
        </div>
      </ResponsiveContainer>

      {/* Main content landmark */}
      <ResponsiveContainer as="main" aria-label="Main content" className="py-8">
        <h1 className="text-xl font-semibold mb-4">Featured Properties</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <article key={i} className="bg-white rounded-lg shadow p-4">
              <div
                className="h-48 bg-gray-200 rounded mb-4"
                aria-hidden="true"
              />
              <h2 className="font-semibold">Property {i}</h2>
              <p className="text-gray-600">$500,000</p>
            </article>
          ))}
        </div>
      </ResponsiveContainer>

      {/* Footer landmark */}
      <ResponsiveContainer as="footer" className="bg-gray-800 text-white mt-12">
        <div className="py-8">
          <p>&copy; 2024 PropChain. All rights reserved.</p>
        </div>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Comparison example showing both container types
 */
export function ComparisonExample() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold mb-2 px-4">
          Step-based Container (Default)
        </h2>
        <ResponsiveContainer
          as="section"
          aria-labelledby="step-based-heading"
          className="bg-blue-100"
        >
          <p id="step-based-heading">
            This container uses step-based padding that changes at breakpoints:
            16px (mobile) → 24px (tablet) → 32px (desktop)
          </p>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2 px-4">Fluid Container</h2>
        <ResponsiveContainerFluid
          as="section"
          aria-labelledby="fluid-desc-heading"
          className="bg-green-100"
        >
          <p id="fluid-desc-heading">
            This container uses fluid padding that scales smoothly with viewport
            width using CSS clamp(16px, 4vw, 32px)
          </p>
        </ResponsiveContainerFluid>
      </div>
    </div>
  );
}

/**
 * Demo page component that shows all examples
 */
export default function ResponsiveContainerDemo() {
  return (
    <div className="space-y-12 py-8">
      <ResponsiveContainer>
        <h1 className="text-3xl font-bold mb-2">ResponsiveContainer Examples</h1>
        <p className="text-gray-600 mb-8">
          Explore different use cases for the ResponsiveContainer component
        </p>
      </ResponsiveContainer>

      <section aria-labelledby="basic-heading">
        <ResponsiveContainer>
          <h2 id="basic-heading" className="text-2xl font-semibold mb-4">
            Basic Usage
          </h2>
        </ResponsiveContainer>
        <BasicContainerExample />
      </section>

      <section aria-labelledby="styled-heading">
        <ResponsiveContainer>
          <h2 id="styled-heading" className="text-2xl font-semibold mb-4">
            Styled Container
          </h2>
        </ResponsiveContainer>
        <StyledContainerExample />
      </section>

      <section aria-labelledby="comparison-heading">
        <ResponsiveContainer>
          <h2 id="comparison-heading" className="text-2xl font-semibold mb-4">
            Fluid vs Step-based
          </h2>
        </ResponsiveContainer>
        <ComparisonExample />
      </section>

      <section aria-labelledby="nested-heading">
        <ResponsiveContainer>
          <h2 id="nested-heading" className="text-2xl font-semibold mb-4">
            Nested Containers
          </h2>
        </ResponsiveContainer>
        <NestedContainersExample />
      </section>

      <section aria-labelledby="fluid-example-heading">
        <ResponsiveContainer>
          <h2 id="fluid-example-heading" className="text-2xl font-semibold mb-4">
            Fluid Container
          </h2>
        </ResponsiveContainer>
        <FluidContainerExample />
      </section>
    </div>
  );
}
