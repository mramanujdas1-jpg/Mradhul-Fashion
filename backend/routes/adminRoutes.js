const express = require('express');
const router = express.Router();
const { Order, Product, User } = require('../models');
const { protect, admin } = require('../auth');

// Get Dashboard Analytics
router.get('/analytics', protect, admin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({});
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const orders = await Order.find({});

    const totalOrders = orders.length;
    const totalSales = orders.reduce((acc, order) => {
      // Include only completed or processing/paid orders for sales total
      return order.isPaid ? acc + order.totalPrice : acc;
    }, 0);

    // Group sales by date
    const salesByDate = {};
    // Order status breakdown
    const orderStatusCount = {
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      'Out For Delivery': 0,
      Delivered: 0,
      Cancelled: 0
    };

    orders.forEach(order => {
      // Date formatting for charts
      const dateStr = order.createdAt.toISOString().slice(0, 10);
      if (order.isPaid) {
        salesByDate[dateStr] = (salesByDate[dateStr] || 0) + order.totalPrice;
      }
      // Status breakdown
      if (orderStatusCount[order.status] !== undefined) {
        orderStatusCount[order.status]++;
      }
    });

    const formattedSalesByDate = Object.keys(salesByDate).map(date => ({
      date,
      sales: salesByDate[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      summary: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalSales
      },
      salesByDate: formattedSalesByDate,
      orderStatusCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get All Users
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update User Role (make admin, etc.)
router.put('/users/:id/role', protect, admin, async (req, res) => {
  const { role } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.email === 'admin@mradhulfashion.com') {
        return res.status(400).json({ message: 'Primary admin role cannot be changed' });
      }
      user.role = role || user.role;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete User
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin') {
        return res.status(400).json({ message: 'Admin accounts cannot be deleted' });
      }
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
