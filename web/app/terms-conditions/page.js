import InfoPage from '../../components/InfoPage';

export const metadata = {
  title: 'Terms & Conditions | Mradhul Fashion',
  description: 'Terms and conditions for using Mradhul Fashion ecommerce services.',
};

export default function TermsConditionsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms & Conditions"
      description="These terms govern shopping, selling, payments, returns, and account usage on Mradhul Fashion."
      sections={[
        {
          heading: 'Use of Platform',
          body: 'By using Mradhul Fashion, customers and sellers agree to provide accurate account, order, and fulfillment information.',
        },
        {
          heading: 'Product Information',
          body: 'We work to keep pricing, images, sizes, stock, and descriptions accurate. In rare cases, orders may be reviewed or cancelled if catalog or inventory data is incorrect.',
        },
        {
          heading: 'Payments',
          body: 'Razorpay prepaid payments are subject to successful authorization and signature verification. Cash on Delivery orders remain subject to serviceability and order validation.',
        },
        {
          heading: 'Seller Responsibilities',
          items: [
            'Sellers must provide accurate catalog, stock, shipment, and return information.',
            'Admin approval is required before seller products become manageable through the seller panel.',
            'Fraudulent, misleading, or prohibited listings may be removed.',
          ],
        },
      ]}
    />
  );
}
