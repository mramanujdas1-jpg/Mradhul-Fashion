import { canonicalUrl, serverApiUrl } from './config';

export default async function sitemap() {
  const routes = [
    '',
    '/products',
    '/cart',
    '/profile',
  ].map((route) => ({
    url: canonicalUrl(route || '/'),
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    const productsEndpoint = serverApiUrl('/products?pageSize=100');
    if (!productsEndpoint) return routes;

    const res = await fetch(productsEndpoint, {
      next: { revalidate: 3600 } // cache sitemap fetch for an hour
    });
    if (res.ok) {
      const data = await res.json();
      const productUrls = (data.products || []).map((p) => ({
        url: canonicalUrl(`/products/${p._id}`),
        lastModified: new Date(p.updatedAt || p.createdAt || new Date()).toISOString().split('T')[0],
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
      return [...routes, ...productUrls];
    }
  } catch (e) {
    console.warn('Failed to fetch products for sitemap. Using static fallback routes.');
  }

  return routes;
}
