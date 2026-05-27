const express = require('express');
const router = express.Router();
const { Order, Product } = require('../models');
const { protect, admin } = require('../auth');
const { notifyOrderStatusChange } = require('../services/notificationService');
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
  console.error('Razorpay SDK initialization failed:', error.message);
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
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name || item.product}` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `${product.name} has only ${product.stock} item${product.stock === 1 ? '' : 's'} available.`
        });
      }
    }

    if (paymentMethod === 'Razorpay') {
      const existingPendingOrder = await Order.findOne({
        user: req.user._id,
        status: 'Pending',
        paymentMethod: 'Razorpay',
        totalPrice: totalPrice
      }).sort({ createdAt: -1 });

      if (existingPendingOrder && existingPendingOrder.orderItems.length === orderItems.length) {
        return res.status(201).json(existingPendingOrder);
      }
    }

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
        return res.status(503).json({ message: 'Razorpay is not configured for prepaid checkout.' });
      }
    }

    const createdOrder = await order.save();

    // Decrement stock levels only if COD. For Razorpay, deduct on payment confirmation.
    if (paymentMethod === 'COD') {
      for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.qty }
        });
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Order Payment to Paid
router.put('/:id/pay', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Cryptographic signature check
    if (process.env.RAZORPAY_KEY_SECRET) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing signature verification parameters' });
      }
      
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment signature verification failed' });
      }
    } else {
      return res.status(503).json({ message: 'Razorpay signature verification is not configured.' });
    }

    // Atomic update to prevent race conditions
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id, isPaid: false },
      {
        $set: {
          isPaid: true,
          paidAt: Date.now(),
          status: 'Processing',
          paymentResult: {
            id: razorpay_payment_id,
            status: 'Paid',
            update_time: Date.now().toString(),
            email_address: req.user.email
          }
        },
        $push: {
          trackingSteps: {
            status: 'Processing',
            description: 'Payment verified. Order is being packed in our warehouse.'
          }
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      const checkOrder = await Order.findById(req.params.id);
      if (checkOrder && checkOrder.isPaid) {
        return res.status(400).json({ message: 'Order is already paid.' });
      }
      return res.status(404).json({ message: 'Order not found' });
    }

    // Decrement stock levels since payment is confirmed
    for (const item of updatedOrder.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty }
      });
    }

    await updatedOrder.populate('user');
    notifyOrderStatusChange(updatedOrder.user, updatedOrder._id, updatedOrder.status).catch(() => {});

    res.json(updatedOrder);
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
      
      // Notify user asynchronously
      await updatedOrder.populate('user');
      notifyOrderStatusChange(updatedOrder.user, updatedOrder._id, updatedOrder.status).catch(() => {});

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User: Cancel Order (Only if Pending or Processing)
router.put('/:id/cancel', protect, async (req, res) => {
  const { reason } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (order.status !== 'Pending' && order.status !== 'Processing') {
      return res.status(400).json({ message: 'Order cannot be cancelled after shipment.' });
    }

    order.status = 'Cancelled';
    order.trackingSteps.push({
      status: 'Cancelled',
      description: `Order cancelled by customer. Reason: ${reason || 'Customer request'}`
    });

    // Restore stock levels
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.qty }
      });
    }

    const updatedOrder = await order.save();
    
    // Notify user asynchronously
    await updatedOrder.populate('user');
    notifyOrderStatusChange(updatedOrder.user, updatedOrder._id, updatedOrder.status).catch(() => {});

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User: Request Return (Only if Delivered, within 7 days)
router.put('/:id/return', protect, async (req, res) => {
  const { reason, comment } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Order must be delivered before requesting a return.' });
    }

    // Check 7 days limit
    const returnLimit = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    if (order.deliveredAt && (Date.now() - new Date(order.deliveredAt).getTime() > returnLimit)) {
      return res.status(400).json({ message: 'Return period (7 days) has expired.' });
    }

    order.status = 'Return Requested';
    order.trackingSteps.push({
      status: 'Return Requested',
      description: `Customer requested a return. Reason: ${reason}. Comments: ${comment || 'None'}`
    });

    const updatedOrder = await order.save();
    await updatedOrder.populate('user');
    notifyOrderStatusChange(updatedOrder.user, updatedOrder._id, updatedOrder.status).catch(() => {});
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
