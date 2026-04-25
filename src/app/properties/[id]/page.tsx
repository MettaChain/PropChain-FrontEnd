import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MOCK_PROPERTIES } from '@/lib/mockData';
import { PropertyDetailClient } from './PropertyDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = MOCK_PROPERTIES.find((p) => p.id === id);

  if (!property) {
    return { title: 'Property Not Found | PropChain' };
  }

  const title = `${property.name} | PropChain`;
  const description = `${property.description.slice(0, 155)}...`;
  const image = property.images[0] ?? 'https://propchain.io/og-default.png';
  const url = `https://propchain.io/properties/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'PropChain',
      images: [{ url: image, width: 1200, height: 630, alt: property.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      site: '@PropChain',
    },
    alternates: { canonical: url },
  };
}

export async function generateStaticParams() {
  return MOCK_PROPERTIES.map((p) => ({ id: p.id }));
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = MOCK_PROPERTIES.find((p) => p.id === id);

  if (!property) notFound();

  return <PropertyDetailClient property={property} />;
}
