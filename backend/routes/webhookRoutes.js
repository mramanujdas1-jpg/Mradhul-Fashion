const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { Order } = require('../models');

// Razorpay Webhook Endpoint
router.post('/razorpay', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('Razorpay webhook secret not configured.');
      return res.status(503).send('Webhook secret not configured');
    }

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    // Event handling
    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`Received Razorpay webhook event: ${event}`);

    // We mainly care about payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      let rzpOrderId = null;
      
      if (event === 'order.paid') {
        rzpOrderId = payload.order?.entity?.id;
      } else if (event === 'payment.captured') {
        rzpOrderId = payload.payment?.entity?.order_id;
      }

      if (rzpOrderId) {
        // Find all unpaid orders matching this Razorpay order ID
        const ordersToFulfill = await Order.find({ 'paymentResult.id': rzpOrderId, isPaid: false });

        if (ordersToFulfill.length > 0) {
          for (const order of ordersToFulfill) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.status = 'Processing';
            order.trackingSteps.push({
              status: 'Processing',
              description: 'Payment successfully captured via webhook. Order is being processed.'
            });

            if (event === 'payment.captured') {
              order.paymentResult = {
                id: payload.payment.entity.id,
                status: 'Paid',
                update_time: Date.now().toString(),
                email_address: payload.payment.entity.email || ''
              };
            } else {
              order.paymentResult = {
                ...order.paymentResult,
                status: 'Paid',
                update_time: Date.now().toString()
              };
            }

            await order.save();

            // Decrement stock levels since payment is confirmed via webhook
            for (const item of order.orderItems) {
              const incPayload = { stock: -item.qty };
              if (item.size) {
                incPayload[`stockPerSize.${item.size}`] = -item.qty;
              }
              await require('../models').Product.findByIdAndUpdate(item.product, {
                $inc: incPayload
              });
              if (item.color) {
                await require('../models').Product.updateOne(
                  {
                    _id: item.product,
                    variantImages: { $elemMatch: { color: item.color, stock: { $exists: true } } }
                  },
                  { $inc: { 'variantImages.$.stock': -item.qty } }
                );
                if (item.size) {
                  await require('../models').Product.updateOne(
                    {
                      _id: item.product,
                      variantImages: { $elemMatch: { color: item.color, [`stockPerSize.${item.size}`]: { $exists: true } } }
                    },
                    { $inc: { [`variantImages.$.stockPerSize.${item.size}`]: -item.qty } }
                  );
                }
              }
            }
            console.log(`Order ${order._id} marked as paid via webhook.`);
          }
        } else {
          console.log(`No unpaid orders found for rzp_id ${rzpOrderId} or already paid.`);
        }
      }
    } else if (event === 'payment.failed') {
      const rzpOrderId = payload.payment?.entity?.order_id;
      if (rzpOrderId) {
        const order = await Order.findOne({ 'paymentResult.id': rzpOrderId });
        if (order && order.status === 'Pending') {
          order.status = 'Payment Failed';
          order.trackingSteps.push({
            status: 'Payment Failed',
            description: `Payment failed: ${payload.payment.entity.error_description || 'Unknown error'}`
          });
          await order.save();
        }
      }
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
