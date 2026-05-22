const express = require('express');
const router = express.Router();
const { Order, Product } = require('../models');
const { protect, admin } = require('../auth');
const Razorpay = require('razorpay');

let razorpayInstance;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch (error) {
  console.error('Razorpay SDK initialization failed, payment creation will run in Mock Mode.', error.message);
}

// Create New Order
router.post('/', protect, async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  try {
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      trackingSteps: [
        { status: 'Pending', description: 'Your order has been received and is waiting processing.' }
      ]
    });

    // Handle Razorpay payment setup
    if (paymentMethod === 'Razorpay') {
      if (razorpayInstance) {
        const options = {
          amount: Math.round(totalPrice * 100), // in paise
          currency: 'INR',
          receipt: `receipt_order_${Date.now()}`
        };
        const rzpOrder = await razorpayInstance.orders.create(options);
        order.paymentResult = {
          id: rzpOrder.id,
          status: 'Created'
        };
      } else {
        // Mock Mode if keys are not set
        order.paymentResult = {
          id: `mock_rzp_id_${Math.random().toString(36).substr(2, 9)}`,
          status: 'Created'
        };
      }
    }

    const createdOrder = await order.save();

    // Decrement stock levels
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty }
      });
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Order Payment to Paid
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'Processing';
      order.paymentResult = {
        id: req.body.razorpay_payment_id || req.body.id || order.paymentResult.id,
        status: 'Paid',
        update_time: Date.now().toString(),
        email_address: req.user.email
      };

      order.trackingSteps.push({
        status: 'Processing',
        description: 'Payment verified. Order is being packed in our warehouse.'
      });

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Logged In User Orders
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Order By ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get All Orders
router.get('/', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update Order Status & Add Tracking Step
router.put('/:id/status', protect, admin, async (req, res) => {
  const { status, description } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = status;
      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        // If COD, mark as paid upon delivery
        if (order.paymentMethod === 'COD') {
          order.isPaid = true;
          order.paidAt = Date.now();
        }
      }

      order.trackingSteps.push({
        status,
        description: description || `Order state updated to: ${status}`
      });

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
