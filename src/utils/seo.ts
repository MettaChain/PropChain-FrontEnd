import type { Metadata } from 'next';
import type { Property } from '@/types/property';

interface SEOConfig {
  title: string;
  description: string;
  url: string;
  images?: string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://propchain.io';
const SITE_NAME = 'PropChain';
const DEFAULT_DESCRIPTION = 'Multi-chain real estate investment platform offering tokenized property investments on Ethereum, Polygon, and BSC';

/**
 * Generate comprehensive metadata for SEO and social sharing
 */
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    url,
    images = [],
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    keywords = []
  } = config;

  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const defaultImage = `${SITE_URL}/images/og-default.jpg`;
  const ogImages = images.length > 0 ? images : [defaultImage];

  // Ensure images are absolute URLs
  const processedImages = ogImages.map(img => 
    img.startsWith('http') ? img : `${SITE_URL}${img}`
  );

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    
    // Open Graph tags
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type,
      locale: 'en_US',
      images: processedImages.map((image, index) => ({
        url: image,
        width: 1200,
        height: 630,
        alt: title,
        type: 'image/jpeg',
      })),
      publishedTime,
      modifiedTime,
    },

    // Twitter Card tags
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: processedImages,
      creator: '@propchain',
      site: '@propchain',
    },

    // Additional meta tags
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verification tags (add your actual verification codes)
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },

    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },

    // App tags for mobile
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': SITE_NAME,
      'application-name': SITE_NAME,
      'msapplication-TileColor': '#2563eb',
      'theme-color': '#2563eb',
    },
  };
}

/**
 * Generate property-specific metadata
 */
export function generatePropertyMetadata(property: Property, url: string): Metadata {
  const keywords = [
    property.name,
    property.location.city,
    property.location.state,
    property.propertyType,
    'real estate',
    'investment',
    'tokenization',
    property.blockchain,
    `${property.propertyType} investment`,
    `${property.location.city} real estate`,
    'blockchain real estate',
    'digital property',
    'fractional ownership',
  ];

  const description = `Invest in ${property.name} in ${property.location.city}, ${property.location.state}. ${property.description.slice(0, 150)}... Earn ${property.metrics.roi}% annual ROI with tokenized real estate investment.`;

  return generateMetadata({
    title: `${property.name} - ${property.location.city} Real Estate Investment`,
    description,
    url,
    images: property.images.slice(0, 3), // Use first 3 property images
    type: 'article',
    publishedTime: property.listedDate,
    modifiedTime: property.updatedAt,
    author: 'PropChain',
    keywords,
  });
}

/**
 * Generate JSON-LD structured data for property
 */
export function generatePropertyStructuredData(property: Property, url: string) {
  const canonicalUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.name,
    description: property.description,
    url: canonicalUrl,
    image: property.images,
    offers: {
      '@type': 'Offer',
      price: property.price.total,
      priceCurrency: property.price.currency,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.location.address,
      addressLocality: property.location.city,
      addressRegion: property.location.state,
      addressCountry: property.location.country,
      postalCode: property.location.zipCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.location.coordinates.lat,
      longitude: property.location.coordinates.lng,
    },
    numberOfRooms: property.details.bedrooms || 0,
    numberOfBathroomsTotal: property.details.bathrooms || 0,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.details.squareFeet,
      unitCode: 'SQF',
      unitText: 'square feet',
    },
    yearBuilt: property.details.yearBuilt,
    propertyType: property.propertyType,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'ROI',
        value: property.metrics.roi,
        unitText: 'percent',
      },
      {
        '@type': 'PropertyValue',
        name: 'Blockchain',
        value: property.blockchain,
      },
      {
        '@type': 'PropertyValue',
        name: 'Token Supply',
        value: property.tokenInfo.totalSupply,
      },
      {
        '@type': 'PropertyValue',
        name: 'Available Tokens',
        value: property.tokenInfo.available,
      },
    ],
    datePosted: property.listedDate,
    dateModified: property.updatedAt,
  };

  return JSON.stringify(structuredData);
}

/**
 * Generate JSON-LD structured data for organization
 */
export function generateOrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description: DEFAULT_DESCRIPTION,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-PROPCHAIN',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
    sameAs: [
      'https://twitter.com/propchain',
      'https://facebook.com/propchain',
      'https://linkedin.com/company/propchain',
      'https://instagram.com/propchain',
    ],
  };

  return JSON.stringify(structuredData);
}

/**
 * Generate JSON-LD structured data for website
 */
export function generateWebsiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/properties?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return JSON.stringify(structuredData);
}

/**
 * Generate JSON-LD structured data for breadcrumb
 */
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url.startsWith('http') ? breadcrumb.url : `${SITE_URL}${breadcrumb.url}`,
    })),
  };

  return JSON.stringify(structuredData);
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt() {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-properties.xml

# Block unnecessary crawlers
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

# Allow specific important paths
User-agent: *
Allow: /properties/
Allow: /about
Allow: /contact
Allow: /blog/

# Disallow admin and private paths
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/
Disallow: /404
Disallow: /500
`;
}

/**
 * Generate sitemap entry
 */
export function generateSitemapEntry(url: string, lastModified?: Date, priority?: number, changeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never') {
  return {
    url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
    lastModified: lastModified?.toISOString() || new Date().toISOString(),
    changeFrequency: changeFreq || 'weekly',
    priority: priority || 0.8,
  };
}
