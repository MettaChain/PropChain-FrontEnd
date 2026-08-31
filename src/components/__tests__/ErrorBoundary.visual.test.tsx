import React from 'react';
import { render } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// A component that throws on render to trigger the error boundary
const Bomb: React.FC = () => {
  throw new Error('Visual snapshot test error');
};

describe('ErrorBoundary (visual)', () => {
  it('renders fallback UI and matches snapshot', () => {
    const { container } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(container).toMatchSnapshot();
  });
});
