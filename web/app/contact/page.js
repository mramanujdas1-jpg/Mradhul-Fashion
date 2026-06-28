import InfoPage from '../../components/InfoPage';

export const metadata = {
  title: 'Contact Us | Mradhul Fashion',
  description: 'Contact Mradhul Fashion for order, seller, return, and customer support.',
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Customer Care"
      title="Contact Mradhul Fashion"
      description="For order support, returns, seller onboarding, or product questions, reach the Mradhul Fashion support team through the details below."
      sections={[
        {
          heading: 'Support Hours',
          items: [
            'Monday to Saturday: 10:00 AM to 7:00 PM IST.',
            'Order and return requests submitted from your profile remain available 24/7.',
            'Urgent payment or shipment issues are prioritized by order date and status.',
          ],
        },
        {
          heading: 'Email Support',
          body: 'For customer service, write to support@mradhulfashion.com with your order ID, registered email, and a short description of the issue.',
        },
        {
          heading: 'Seller Support',
          body: 'Approved and pending sellers can include their registered store name and Firebase account email when requesting catalog or fulfillment help.',
        },
      ]}
      cta={{
        title: 'Need order help?',
        body: 'Signed-in customers can track orders, request cancellation, request returns, and print invoices from the profile dashboard.',
        href: '/profile',
        label: 'Open Profile',
      }}
    />
  );
}
