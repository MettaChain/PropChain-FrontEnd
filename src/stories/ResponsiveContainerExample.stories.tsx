import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  BasicContainerExample,
  StyledContainerExample,
  NestedContainersExample,
  FluidContainerExample,
  PageLayoutExample,
  ComparisonExample,
  ResponsiveContainerDemo,
} from '@/components/responsive/ResponsiveContainerExample';

const meta = {
  title: 'Components/Responsive/ResponsiveContainerExample',
  component: ResponsiveContainerDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The ResponsiveContainerExample component demonstrates various use cases for the ResponsiveContainer and ResponsiveContainerFluid components.

## Features

- **Responsive Padding**: Automatically adjusts padding based on viewport size
- **Step-based Scaling**: Default container uses breakpoint-based padding (16px mobile → 24px tablet → 32px desktop)
- **Fluid Scaling**: Fluid variant uses CSS clamp() for smooth, continuous scaling
- **Flexible Styling**: Supports custom className for additional styling
- **Nested Support**: Can be nested for complex layouts
- **Accessibility**: Maintains consistent spacing for screen readers and keyboard navigation

## When to Use

- **Page Layouts**: Use for consistent page-wide padding
- **Content Sections**: Wrap major content sections for consistent spacing
- **Card/Grid Layouts**: Nest within grids for consistent inner spacing
- **Fluid vs Step-based**: Choose fluid for smoother transitions, step-based for predictable breakpoints

## Accessibility Notes

- **Semantic Structure**: Use appropriate semantic HTML elements (header, main, section, footer) inside containers
- **Focus Management**: Containers do not interfere with keyboard navigation
- **Screen Readers**: Padding is visual only and does not affect screen reader experience
- **Responsive Design**: Ensures content remains accessible across all viewport sizes
- **Color Contrast**: When adding custom backgrounds, ensure sufficient color contrast (WCAG AA: 4.5:1 for text)

## Props

### ResponsiveContainer & ResponsiveContainerFluid

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Content to be wrapped in the container |
| className | string | - | Additional CSS classes for custom styling |

## Performance Considerations

- **Step-based**: Minimal performance impact, uses viewport category detection
- **Fluid**: Uses CSS clamp() which is highly performant and GPU-accelerated
- **Re-renders**: Step-based version re-renders on viewport category changes
- **CSS-only**: Fluid variant is pure CSS with no JavaScript overhead
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the container',
    },
  },
} satisfies Meta<typeof ResponsiveContainerDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => <BasicContainerExample />,
  parameters: {
    docs: {
      description: {
        story: 'Basic usage example showing the default ResponsiveContainer with responsive padding that adapts to screen size (16px mobile, 24px tablet, 32px desktop).',
      },
    },
  },
};

export const Styled: Story = {
  render: () => <StyledContainerExample />,
  parameters: {
    docs: {
      description: {
        story: 'Container with custom styling using Tailwind CSS classes. Demonstrates how to combine ResponsiveContainer with additional styling.',
      },
    },
  },
};

export const Nested: Story = {
  render: () => <NestedContainersExample />,
  parameters: {
    docs: {
      description: {
        story: 'Example showing nested ResponsiveContainer components. Useful for creating complex layouts with consistent spacing at multiple levels.',
      },
    },
  },
};

export const Fluid: Story = {
  render: () => <FluidContainerExample />,
  parameters: {
    docs: {
      description: {
        story: 'Fluid container example using ResponsiveContainerFluid with smooth, continuous padding scaling via CSS clamp(). Provides smoother transitions between breakpoints.',
      },
    },
  },
};

export const PageLayout: Story = {
  render: () => <PageLayoutExample />,
  parameters: {
    docs: {
      description: {
        story: 'Complete page layout example showing how to use ResponsiveContainer for header, main content, and footer sections.',
      },
    },
  },
};

export const Comparison: Story = {
  render: () => <ComparisonExample />,
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of step-based (default) and fluid container implementations to help choose the right approach for your use case.',
      },
    },
  },
};

export const AllExamples: Story = {
  render: () => <ResponsiveContainerDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Complete demo page showcasing all ResponsiveContainer examples together.',
      },
    },
  },
};
