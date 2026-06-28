import InfoPage from '../../components/InfoPage';

export const metadata = {
  title: 'FAQ | Mradhul Fashion',
  description: 'Frequently asked questions about Mradhul Fashion orders, payments, shipping, returns, and seller onboarding.',
};

export default function FAQPage() {
  return (
    <InfoPage
      eyebrow="Help Centre"
      title="Frequently Asked Questions"
      description="Answers to common questions about shopping, payments, shipment tracking, returns, and account access on Mradhul Fashion."
      sections={[
        {
          heading: 'How do I track my order?',
          body: 'Sign in with the same Firebase account used at checkout and open your profile. Every order includes the current status and shipment timeline.',
        },
        {
          heading: 'Which payment methods are supported?',
          body: 'Mradhul Fashion supports Cash on Delivery and Razorpay prepaid payments where enabled by the platform.',
        },
        {
          heading: 'Can I cancel an order?',
          body: 'Orders can be cancelled only while they are Pending or Processing. Once shipped, out for delivery, delivered, or already cancelled, cancellation is blocked.',
        },
        {
          heading: 'Can I return a delivered order?',
          body: 'Return requests are available after delivery and must be submitted within the active return window shown in the Return Policy.',
        },
        {
          heading: 'How do sellers join?',
          body: 'Eligible boutique and artisan sellers can apply from the profile page. Admin approval is required before selling products.',
        },
      ]}
    />
  );
}
