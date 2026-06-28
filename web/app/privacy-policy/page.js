import InfoPage from '../../components/InfoPage';

export const metadata = {
  title: 'Privacy Policy | Mradhul Fashion',
  description: 'Privacy practices for Mradhul Fashion customer, seller, order, payment, and account data.',
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="This policy explains how Mradhul Fashion handles customer, seller, order, authentication, and support information."
      sections={[
        {
          heading: 'Information We Collect',
          items: [
            'Account details provided through Firebase Authentication, including name, email, and phone where applicable.',
            'Order, cart, wishlist, address, return, and support information needed to operate the ecommerce service.',
            'Seller onboarding details submitted for admin review.',
          ],
        },
        {
          heading: 'How We Use Data',
          items: [
            'To process orders, payments, shipment updates, returns, and customer support.',
            'To keep carts, wishlists, reviews, and order history synchronized across web and mobile.',
            'To improve catalog quality, fraud prevention, and platform reliability.',
          ],
        },
        {
          heading: 'Payments and Authentication',
          body: 'Payments are processed through Razorpay, and authentication is handled through Firebase. Mradhul Fashion does not store card credentials.',
        },
        {
          heading: 'Data Requests',
          body: 'Customers can contact support@mradhulfashion.com for account, order, or privacy-related assistance.',
        },
      ]}
    />
  );
}
