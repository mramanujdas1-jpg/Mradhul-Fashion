import InfoPage from '../../components/InfoPage';

export const metadata = {
  title: 'Return Policy | Mradhul Fashion',
  description: 'Return policy for eligible delivered Mradhul Fashion orders.',
};

export default function ReturnPolicyPage() {
  return (
    <InfoPage
      eyebrow="Orders"
      title="Return Policy"
      description="Eligible delivered orders can be submitted for return review from the customer profile dashboard."
      sections={[
        {
          heading: 'Return Window',
          body: 'Return requests must be submitted within 15 days of delivery unless a product-specific policy states otherwise.',
        },
        {
          heading: 'Return Requirements',
          items: [
            'The order must be marked Delivered.',
            'The customer must provide a return reason.',
            'An optional description can be added for fit, quality, damage, or shipment concerns.',
            'Items should be unused, unaltered, and kept with original tags and packaging where applicable.',
          ],
        },
        {
          heading: 'Review Process',
          body: 'Submitting a return request changes the order status for review. Support or fulfillment teams may contact the customer for additional information.',
        },
      ]}
    />
  );
}
