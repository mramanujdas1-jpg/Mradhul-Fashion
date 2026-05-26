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
        // Find the order that has this razorpay order ID
        const order = await Order.findOne({ 'paymentResult.id': rzpOrderId });
        
        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = Date.now();
          order.status = 'Processing';
          
          if (event === 'payment.captured') {
            order.paymentResult = {
              id: payload.payment.entity.id,
              status: 'Paid',
              update_time: Date.now().toString(),
              email_address: payload.payment.entity.email || ''
            };
          }

          order.trackingSteps.push({
            status: 'Processing',
            description: 'Payment successfully captured via webhook. Order is being processed.'
          });

          await order.save();
          console.log(`Order ${order._id} marked as paid via webhook.`);
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
