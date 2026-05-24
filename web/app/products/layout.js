import { BRAND_DESCRIPTION, BRAND_NAME, SEO_IMAGES, canonicalUrl } from '../config';

export const metadata = {
  title: 'Shop Luxury Jaipur Ethnic Wear',
  description:
    'Explore Mradhul Fashion collections of handcrafted sarees, designer lehengas, royal Anarkalis, festive sets, jackets, and dupattas for premium Indian occasions.',
  alternates: {
    canonical: canonicalUrl('/products'),
  },
  openGraph: {
    type: 'website',
    url: canonicalUrl('/products'),
    siteName: BRAND_NAME,
    title: `Shop Luxury Jaipur Ethnic Wear | ${BRAND_NAME}`,
    description: BRAND_DESCRIPTION,
    images: [
      {
        url: SEO_IMAGES.social,
        width: 1200,
        height: 630,
        alt: 'Luxury Jaipur ethnic wear by Mradhul Fashion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Shop Luxury Jaipur Ethnic Wear | ${BRAND_NAME}`,
    description: BRAND_DESCRIPTION,
    images: [SEO_IMAGES.social],
  },
};

export default function ProductsLayout({ children }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: canonicalUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: canonicalUrl('/products'),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
