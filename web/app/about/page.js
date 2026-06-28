import InfoPage from '../../components/InfoPage';

export const metadata = {
  title: 'About Us | Mradhul Fashion',
  description: 'Learn about Mradhul Fashion, a premium Jaipur ethnic fashion marketplace for women.',
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Our Story"
      title="Luxury Jaipur Ethnic Fashion, Crafted With Care"
      description="Mradhul Fashion curates premium women-only ethnic wear inspired by Jaipur craft traditions, festive elegance, and modern occasion dressing."
      sections={[
        {
          heading: 'What We Stand For',
          body: 'We bring together handcrafted silhouettes, thoughtful detailing, and reliable ecommerce operations so customers can shop beautiful occasion wear with confidence.',
        },
        {
          heading: 'Our Curation',
          items: [
            'Women-first sarees, lehengas, Anarkalis, festive sets, dupattas, and fusion wear.',
            'Product pages built around fabric, sizing, imagery, reviews, and delivery clarity.',
            'Seller onboarding designed to support boutique and artisan-led collections.',
          ],
        },
        {
          heading: 'Customer Promise',
          body: 'Every improvement to the platform is made with production stability in mind: secure Firebase authentication, trusted payments, synced orders, and clear post-purchase support.',
        },
      ]}
      cta={{
        title: 'Explore the collection',
        body: 'Discover premium Jaipur-inspired ethnic fashion for weddings, festivities, and graceful everyday occasions.',
        href: '/products',
        label: 'Shop Now',
      }}
    />
  );
}
