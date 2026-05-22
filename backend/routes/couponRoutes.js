const express = require('express');
const router = express.Router();
const { Coupon } = require('../models');
const { protect, admin } = require('../auth');

// Validate Coupon Code
router.post('/validate', protect, async (req, res) => {
  const { code } = req.body;
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or inactive coupon code' });
    }

    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ message: 'Coupon code has expired' });
    }

    res.json({
      code: coupon.code,
      discountPercentage: coupon.discountPercentage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin/Customer: Get All Coupons
router.get('/', protect, async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Create Coupon
router.post('/', protect, admin, async (req, res) => {
  const { code, discountPercentage, expiryDate } = req.body;
  try {
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountPercentage,
      expiryDate: new Date(expiryDate)
    });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete Coupon
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      await Coupon.findByIdAndDelete(req.params.id);
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
