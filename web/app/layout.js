import './global.css';
import { AppProvider } from './context';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import {
  BRAND_DESCRIPTION,
  BRAND_NAME,
  BRAND_TAGLINE,
  SEO_IMAGES,
  SITE_URL,
  canonicalUrl,
} from './config';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: BRAND_NAME,
  category: 'fashion',
  title: {
    default: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`
  },
  description: BRAND_DESCRIPTION,
  keywords: [
    'Mradhul Fashion',
    'Jaipur ethnic wear',
    'luxury Indian fashion',
    'designer lehengas',
    'Gota Patti sarees',
    'Leheriya Anarkali',
    'women ethnic wear India',
    'premium festive wear'
  ],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  alternates: {
    canonical: canonicalUrl('/'),
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: canonicalUrl('/'),
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    images: [
      {
        url: SEO_IMAGES.social,
        width: 1200,
        height: 630,
        alt: 'Mradhul Fashion luxury Jaipur ethnic wear collection',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME} | ${BRAND_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    images: [SEO_IMAGES.social],
  }
};

export const viewport = {
  themeColor: '#701122'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans transition-colors duration-300">
        <AppProvider>
          <Navbar />
          <CartDrawer />
          <main className="flex-grow pt-28">
            {children}
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
