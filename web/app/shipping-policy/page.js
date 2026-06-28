import InfoPage from '../../components/InfoPage';

export const metadata = {
  title: 'Shipping Policy | Mradhul Fashion',
  description: 'Shipping policy for Mradhul Fashion orders and shipment timelines.',
};

export default function ShippingPolicyPage() {
  return (
    <InfoPage
      eyebrow="Orders"
      title="Shipping Policy"
      description="Mradhul Fashion ships premium ethnic fashion with clear tracking milestones from order confirmation to delivery."
      sections={[
        {
          heading: 'Processing Time',
          body: 'Most ready-to-ship orders move from Pending to Processing after order validation. Couture or seller-specific products may require additional handling time.',
        },
        {
          heading: 'Shipment Tracking',
          body: 'Customers can view shipment status in the profile dashboard. Admins and sellers update milestones such as Processing, Shipped, Out For Delivery, and Delivered.',
        },
        {
          heading: 'Delivery Charges',
          body: 'Shipping charges and free-shipping thresholds are shown during cart and checkout before order placement.',
        },
        {
          heading: 'Address Accuracy',
          body: 'Customers are responsible for entering complete name, phone, street, city, state, and postal code details at checkout.',
        },
      ]}
    />
  );
}
