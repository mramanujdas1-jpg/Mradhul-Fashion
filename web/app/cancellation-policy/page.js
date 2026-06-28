import InfoPage from '../../components/InfoPage';

export const metadata = {
  title: 'Cancellation Policy | Mradhul Fashion',
  description: 'Cancellation policy for Mradhul Fashion orders.',
};

export default function CancellationPolicyPage() {
  return (
    <InfoPage
      eyebrow="Orders"
      title="Cancellation Policy"
      description="Customers can cancel eligible orders before shipment begins."
      sections={[
        {
          heading: 'When Cancellation Is Allowed',
          body: 'Orders can be cancelled from the profile dashboard while they are Pending or Processing.',
        },
        {
          heading: 'When Cancellation Is Blocked',
          items: [
            'Shipped orders cannot be cancelled.',
            'Out For Delivery orders cannot be cancelled.',
            'Delivered orders must use the return request flow if eligible.',
            'Already cancelled orders cannot be cancelled again.',
          ],
        },
        {
          heading: 'Inventory Restoration',
          body: 'When an eligible order is cancelled, inventory should be restored so that product availability remains accurate.',
        },
      ]}
    />
  );
}
