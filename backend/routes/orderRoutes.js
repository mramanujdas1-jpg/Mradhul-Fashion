const express = require('express');
const router = express.Router();
const { Order, Product } = require('../models');
const { protect, admin, seller } = require('../auth');
const { notifyOrderStatusChange } = require('../services/notificationService');
const Razorpay = require('razorpay');

const buildStockIncrement = (items, direction, includeSizeStock = true) => {
  const updates = [];
  items.forEach((item) => {
    const incPayload = { stock: direction * item.qty };
    if (includeSizeStock && item.size) {
      incPayload[`stockPerSize.${item.size}`] = direction * item.qty;
    }
    updates.push({ product: item.product, incPayload });
  });
  return updates;
};

const applyStockUpdates = async (items, direction, includeSizeStock = true) => {
  const updates = buildStockIncrement(items, direction, includeSizeStock);
  for (const update of updates) {
    await Product.findByIdAndUpdate(update.product, { $inc: update.incPayload });
  }
};

const restoreOrderStock = async (order) => {
  const shouldRestoreStock = order.inventoryReserved || order.paymentMethod === 'COD' || order.isPaid;
  if (!shouldRestoreStock) return;

  const includeSizeStock = order.inventoryReserved || order.paymentMethod === 'COD';
  await applyStockUpdates(order.orderItems, 1, includeSizeStock);
};

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

// Create New Order (Split checkout items by sellerId)
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
    const sellerGroups = {};

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

      const sellerId = product.seller.toString();
      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = [];
      }

      sellerGroups[sellerId].push({
        product: item.product,
        name: product.name,
        qty: item.qty,
        image: product.images[0] || item.image || '/logo.png',
        price: item.price,
        size: item.size
      });
    }

    const sellerIds = Object.keys(sellerGroups);
    if (sellerIds.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Generate Razorpay order if prepaid
    let rzpOrder = null;
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

      if (razorpayInstance) {
        const options = {
          amount: Math.round(totalPrice * 100), // in paise
          currency: 'INR',
          receipt: `receipt_order_${Date.now()}`
        };
        rzpOrder = await razorpayInstance.orders.create(options);
      } else {
        return res.status(503).json({ message: 'Razorpay is not configured for prepaid checkout.' });
      }
    }

    // Create split orders for each seller
    const createdOrders = [];
    const totalItemsPrice = orderItems.reduce((acc, item) => acc + (item.qty * item.price), 0);

    for (const sellerId of sellerIds) {
      const groupItems = sellerGroups[sellerId];
      const groupItemsPrice = groupItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
      
      // Proportional distribution of tax and shipping
      const proportion = totalItemsPrice > 0 ? (groupItemsPrice / totalItemsPrice) : (1 / sellerIds.length);
      const groupTaxPrice = Math.round(taxPrice * proportion * 100) / 100;
      const groupShippingPrice = Math.round(shippingPrice * proportion * 100) / 100;
      const groupTotalPrice = Math.round((groupItemsPrice + groupTaxPrice + groupShippingPrice) * 100) / 100;

      const order = new Order({
        user: req.user._id,
        seller: sellerId,
        orderItems: groupItems,
        shippingAddress,
        paymentMethod,
        itemsPrice: groupItemsPrice,
        taxPrice: groupTaxPrice,
        shippingPrice: groupShippingPrice,
        totalPrice: groupTotalPrice,
        inventoryReserved: paymentMethod === 'COD',
        trackingSteps: [
          { status: 'Pending', description: 'Your order has been received and is waiting processing.' }
        ]
      });

      if (paymentMethod === 'Razorpay' && rzpOrder) {
        order.paymentResult = {
          id: rzpOrder.id,
          status: 'Created'
        };
      }

      const savedOrder = await order.save();
      createdOrders.push(savedOrder);

      // Decrement stock levels immediately only if COD. For Razorpay, deduct on payment confirmation.
      if (paymentMethod === 'COD') {
        await applyStockUpdates(groupItems, -1, true);
      }
    }

    // Return the first created order to preserve perfect frontend compatibility
    res.status(201).json(createdOrders[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Order Payment to Paid (Fulfill all prepaid sibling orders sharing identical rzpOrderId)
router.put('/:id/pay', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
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

    const primaryOrder = await Order.findById(req.params.id);
    if (!primaryOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const rzpOrderId = primaryOrder.paymentResult?.id;
    if (!rzpOrderId) {
      return res.status(400).json({ message: 'Order is not configured for Razorpay.' });
    }

    // Perform atomic updates across all sibling orders sharing identical rzpOrderId
    const siblingOrders = await Order.find({ 'paymentResult.id': rzpOrderId, isPaid: false });

    for (const order of siblingOrders) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'Processing';
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'Paid',
        update_time: Date.now().toString(),
        email_address: req.user.email
      };
      order.trackingSteps.push({
        status: 'Processing',
        description: 'Payment verified. Order is being processed.'
      });

      // Decrement stock levels
      await applyStockUpdates(order.orderItems, -1, true);
      order.inventoryReserved = true;
      await order.save();

      await order.populate('user');
      notifyOrderStatusChange(order.user, order._id, order.status).catch(() => {});
    }

    // Return the updated primary order to client
    const updatedPrimaryOrder = await Order.findById(req.params.id);
    res.json(updatedPrimaryOrder);
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
// Seller/Admin: Get All Orders (Filtered by ownership)
router.get('/seller/mine', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { seller: req.user._id };
    const orders = await Order.find(query)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
      // Verify ownership for sellers
      if (req.user.role === 'seller' && order.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized: this order belongs to another store.' });
      }
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

// Seller/Admin: Update Order Status & Add Tracking Step
router.put('/:id/status', protect, async (req, res) => {
  const { status, description } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      // Enforce seller/admin isolation
      if (req.user.role !== 'admin' && order.seller.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to modify this order.' });
      }

      order.status = status;
      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
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

    if (!['Pending', 'Processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled after shipment.' });
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Customer request';
    order.trackingSteps.push({
      status: 'Cancelled',
      description: `Order cancelled by customer. Reason: ${reason || 'Customer request'}`
    });

    await restoreOrderStock(order);
    order.inventoryReserved = false;

    const updatedOrder = await order.save();
    
    // Notify user asynchronously
    await updatedOrder.populate('user');
    notifyOrderStatusChange(updatedOrder.user, updatedOrder._id, updatedOrder.status).catch(() => {});

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User: Request Return (Only if Delivered, within 15 days)
router.put('/:id/return', protect, async (req, res) => {
  const { reason, description, comment } = req.body;
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

    const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
    const normalizedDescription = typeof description === 'string'
      ? description.trim()
      : (typeof comment === 'string' ? comment.trim() : '');

    if (!normalizedReason) {
      return res.status(400).json({ message: 'Return reason is required.' });
    }

    // Check 15 days limit
    const returnLimit = 15 * 24 * 60 * 60 * 1000; // 15 days in ms
    if (order.deliveredAt && (Date.now() - new Date(order.deliveredAt).getTime() > returnLimit)) {
      return res.status(400).json({ message: 'Return period (15 days) has expired.' });
    }

    order.status = 'Return Requested';
    order.returnRequest = {
      reason: normalizedReason,
      description: normalizedDescription,
      status: 'Requested',
      requestedAt: new Date()
    };
    order.trackingSteps.push({
      status: 'Return Requested',
      description: `Customer requested a return. Reason: ${normalizedReason}. Description: ${normalizedDescription || 'None'}`
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
