import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import PropertyImageCarousel, { type PropertyCarouselImage } from '../components/PropertyImageCarousel';

const twelveImages: PropertyCarouselImage[] = [
  { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop', alt: 'Modern villa exterior' },
  { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop', alt: 'Open-plan living room' },
  { src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&auto=format&fit=crop', alt: 'Bright contemporary kitchen' },
  { src: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&auto=format&fit=crop', alt: 'Minimalist lounge' },
  { src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&auto=format&fit=crop', alt: 'Dining room with natural light' },
  { src: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1600&auto=format&fit=crop', alt: 'Private garden patio' },
  { src: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1600&auto=format&fit=crop', alt: 'Bedroom suite' },
  { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&auto=format&fit=crop', alt: 'Living room detail' },
  { src: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&auto=format&fit=crop', alt: 'Modern bathroom' },
  { src: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&auto=format&fit=crop', alt: 'Interior architecture' },
  { src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1600&auto=format&fit=crop', alt: 'Kitchen island' },
  { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop', alt: 'Villa from the street' },
];

const mixedRatios: PropertyCarouselImage[] = [
  { ...twelveImages[0], aspectRatio: '16 / 9' },
  { ...twelveImages[1], aspectRatio: '4 / 5' },
  { ...twelveImages[2], aspectRatio: '1 / 1' },
  { ...twelveImages[3], aspectRatio: '21 / 9' },
];

const meta = {
  title: 'UI Extensions/PropertyImageCarousel',
  component: PropertyImageCarousel,
  parameters: { layout: 'centered' },
  argTypes: {
    images: { control: 'object', description: 'Image list; edit the array to test carousel states' },
    loading: { control: 'boolean' },
    dark: { control: 'boolean' },
    initialIndex: { control: { type: 'number', min: 0, max: 11 } },
  },
  args: { images: twelveImages, loading: false, dark: false, initialIndex: 0 },
  decorators: [
    (Story) => (
      <div style={{ width: 900, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PropertyImageCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwelveImages: Story = { args: { images: twelveImages } };

export const SingleImage: Story = {
  args: { images: [twelveImages[0]] },
};

export const MixedAspectRatios: Story = {
  args: { images: mixedRatios },
};

export const FourKImages: Story = {
  args: {
    images: [
      { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=3840&q=90&fit=crop', alt: 'High-resolution property exterior' },
      { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=3840&q=90&fit=crop', alt: 'High-resolution property interior' },
    ],
  },
};

export const LoadingState: Story = {
  args: { images: twelveImages, loading: true },
};

export const DarkTheme: Story = {
  args: { images: twelveImages, dark: true },
  decorators: [
    (Story) => (
      <div className="dark rounded-xl bg-slate-950 p-6">
        <Story />
      </div>
    ),
  ],
};
