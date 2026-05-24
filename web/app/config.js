const PRIMARY_SITE_URL = 'https://mradhulfashion.com';

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');
const ensureLeadingSlash = (path = '') => (path.startsWith('/') ? path : `/${path}`);

export const BRAND_NAME = 'Mradhul Fashion';
export const BRAND_TAGLINE = "Luxury Jaipur ethnic fashion for women";
export const BRAND_DESCRIPTION =
  "Shop premium Jaipur ethnic wear for women: handcrafted sarees, designer lehengas, royal Anarkalis, festive sets, artisan jackets, and dupattas from Mradhul Fashion.";

export const SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL ||
    PRIMARY_SITE_URL
);

export const WWW_SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_WWW_SITE_URL || 'https://www.mradhulfashion.com'
);

export const API_BASE = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL || '/api'
);

export const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(value);

export function absoluteUrl(path = '/') {
  return new URL(ensureLeadingSlash(path), `${SITE_URL}/`).toString();
}

export function canonicalUrl(path = '/') {
  return absoluteUrl(path);
}

export function assetUrl(path = '/') {
  return absoluteUrl(path);
}

export function apiUrl(path = '') {
  const normalizedPath = path ? ensureLeadingSlash(path) : '';
  return `${API_BASE}${normalizedPath}`;
}

export function serverApiUrl(path = '') {
  if (!isAbsoluteUrl(API_BASE)) return null;
  return apiUrl(path);
}

export const SEO_IMAGES = {
  logo: assetUrl('/logo.png'),
  social: assetUrl('/banner_ethnic.png'),
};
