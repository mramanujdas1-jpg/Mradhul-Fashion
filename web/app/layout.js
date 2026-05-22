import './global.css';
import { AppProvider } from './context';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: "Mradhul Fashion | Royal Jaipur Handcrafted Women's Designer Wear",
  description: "Shop premium designer women's ethnic clothing: Gota Patti sarees, Leheriya silk Anarkalis, Bagru hand-block Kurtas, and zardozi Bridal Lehengas. Handcrafted with love in Jaipur, Rajasthan.",
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
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
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans transition-colors duration-300">
        <AppProvider>
          <Navbar />
          <main className="flex-grow pt-28">
            {children}
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
