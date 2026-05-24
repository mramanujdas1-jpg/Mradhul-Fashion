import { SITE_URL, canonicalUrl } from './config';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    host: SITE_URL,
    sitemap: canonicalUrl('/sitemap.xml'),
  };
}
