import { BRAND_NAME, SEO_IMAGES, canonicalUrl, serverApiUrl } from '../../config';

async function getProduct(id) {
  const endpoint = serverApiUrl(`/products/${id}`);
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, { next: { revalidate: 900 } });
    if (!response.ok) return null;
    const data = await response.json();
    return data.product || null;
  } catch (error) {
    console.warn('Product SEO fetch failed.', error);
    return null;
  }
}

function productDescription(product) {
  return (
    product?.description ||
    `Discover premium Jaipur ethnic fashion from ${BRAND_NAME}, crafted for elegant weddings, festive occasions, and luxury everyday styling.`
  ).slice(0, 155);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  const title = product?.name || 'Luxury Jaipur Ethnic Wear';
  const description = productDescription(product);
  const image = product?.images?.[0] || SEO_IMAGES.social;
  const canonical = canonicalUrl(`/products/${id}`);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: BRAND_NAME,
      title: `${title} | ${BRAND_NAME}`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 1600,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${BRAND_NAME}`,
      description,
      images: [image],
    },
  };
}

export default async function ProductDetailLayout({ children, params }) {
  const { id } = await params;
  const product = await getProduct(id);
  const canonical = canonicalUrl(`/products/${id}`);

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
      {
        '@type': 'ListItem',
        position: 3,
        name: product?.name || 'Product',
        item: canonical,
      },
    ],
  };

  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: productDescription(product),
        image: product.images || [],
        brand: {
          '@type': 'Brand',
          name: BRAND_NAME,
        },
        category: product.category,
        sku: product._id,
        aggregateRating:
          product.rating > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.numReviews || 1,
              }
            : undefined,
        offers: {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'INR',
          price: product.discountPrice || product.price,
          availability:
            product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {children}
    </>
  );
}
