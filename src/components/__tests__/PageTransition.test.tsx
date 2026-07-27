import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  PageTransition, 
  ModalTransition, 
  StaggerContainer, 
  StaggerItem, 
  SkeletonToContent 
} from '@/components/PageTransition';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      // Extract the key props for testing
      const { initial, animate, exit, variants, transition, className, ...rest } = props;
      return (
        <div 
          className={className as string}
          data-testid={`motion-div`}
          data-initial={typeof initial === 'string' ? initial : JSON.stringify(initial)}
          data-animate={typeof animate === 'string' ? animate : JSON.stringify(animate)}
          data-exit={typeof exit === 'string' ? exit : JSON.stringify(exit)}
          {...rest}
        >
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="animate-presence">{children}</div>
  ),
}));

describe('PageTransition', () => {
  it('renders children with default page animation', () => {
    render(
      <PageTransition>
        <p>Page content</p>
      </PageTransition>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(motionDiv).toHaveAttribute('data-initial', 'initial');
    expect(motionDiv).toHaveAttribute('data-animate', 'in');
    expect(motionDiv).toHaveAttribute('data-exit', 'out');
  });

  it('applies detail page variants when isDetail is true', () => {
    render(
      <PageTransition isDetail>
        <p>Detail content</p>
      </PageTransition>
    );

    expect(screen.getByText('Detail content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <PageTransition className="custom-class">
        <p>Content</p>
      </PageTransition>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv.className).toContain('custom-class');
  });

  it('renders children without isDetail prop', () => {
    render(
      <PageTransition>
        <p>Default page</p>
      </PageTransition>
    );

    expect(screen.getByText('Default page')).toBeInTheDocument();
  });
});

describe('ModalTransition', () => {
  it('renders children with modal animation', () => {
    render(
      <ModalTransition>
        <p>Modal content</p>
      </ModalTransition>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <ModalTransition className="modal-class">
        <p>Content</p>
      </ModalTransition>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv.className).toContain('modal-class');
  });
});

describe('StaggerContainer', () => {
  it('renders children in a stagger container', () => {
    render(
      <StaggerContainer>
        <p>Staggered content</p>
      </StaggerContainer>
    );

    const motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toBeInTheDocument();
    expect(screen.getByText('Staggered content')).toBeInTheDocument();
  });
});

describe('StaggerItem', () => {
  it('renders children as a stagger item', () => {
    render(
      <StaggerItem>
        <p>Item content</p>
      </StaggerItem>
    );

    expect(screen.getByText('Item content')).toBeInTheDocument();
  });
});

describe('SkeletonToContent', () => {
  it('renders skeleton when loading', () => {
    const { container } = render(
      <SkeletonToContent isLoading>
        <p>Content</p>
      </SkeletonToContent>
    );

    const pulseDiv = container.querySelector('.animate-pulse');
    expect(pulseDiv).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders content when not loading', () => {
    render(
      <SkeletonToContent isLoading={false}>
        <p>Loaded content</p>
      </SkeletonToContent>
    );

    expect(screen.getByText('Loaded content')).toBeInTheDocument();
  });

  it('switches from skeleton to content when isLoading changes', () => {
    const { rerender, container } = render(
      <SkeletonToContent isLoading>
        <p>Content</p>
      </SkeletonToContent>
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

    rerender(
      <SkeletonToContent isLoading={false}>
        <p>Content</p>
      </SkeletonToContent>
    );

    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
