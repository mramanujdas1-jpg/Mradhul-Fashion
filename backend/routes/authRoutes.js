const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { protect } = require('../auth');

// Sync User Profile (called after successful Firebase Auth on client)
router.post('/sync', protect, async (req, res) => {
  try {
    const { cart: clientCart, wishlist: clientWishlist } = req.body;
    const user = req.user;
    
    // 1. Merge Wishlist
    if (Array.isArray(clientWishlist)) {
      clientWishlist.forEach(productId => {
        const idStr = productId._id || productId;
        if (idStr && !user.wishlist.some(id => id.toString() === idStr.toString())) {
          user.wishlist.push(idStr);
        }
      });
    }
    
    // 2. Merge Cart
    if (Array.isArray(clientCart)) {
      clientCart.forEach(clientItem => {
        if (!clientItem.product) return;
        const existingIdx = user.cart.findIndex(
          dbItem => dbItem.product.toString() === clientItem.product.toString() && dbItem.size === clientItem.size
        );
        if (existingIdx > -1) {
          user.cart[existingIdx].qty = Math.max(user.cart[existingIdx].qty, clientItem.qty);
        } else {
          user.cart.push({
            product: clientItem.product,
            qty: clientItem.qty,
            size: clientItem.size
          });
        }
      });
    }
    
    await user.save();
    
    // Populate product details in user cart/wishlist
    const populatedUser = await User.findById(user._id)
      .populate('cart.product')
      .populate('wishlist');
      
    // Format populated cart items
    const formattedCart = (populatedUser.cart || []).map(item => {
      if (!item.product) return null;
      return {
        product: item.product._id,
        name: item.product.name,
        qty: item.qty,
        image: item.product.images[0],
        price: item.product.discountPrice || item.product.price,
        size: item.size
      };
    }).filter(Boolean);

    res.status(200).json({
      _id: populatedUser._id,
      name: populatedUser.name,
      email: populatedUser.email,
      role: populatedUser.role,
      addresses: populatedUser.addresses || [],
      wishlist: populatedUser.wishlist || [],
      cart: formattedCart
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update persistent Cart in database
router.post('/cart', protect, async (req, res) => {
  try {
    const { cart } = req.body;
    if (Array.isArray(cart)) {
      req.user.cart = cart.map(item => ({
        product: item.product,
        qty: item.qty,
        size: item.size
      }));
      await req.user.save();
    }
    res.json(req.user.cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update persistent Wishlist in database
router.post('/wishlist', protect, async (req, res) => {
  try {
    const { wishlist } = req.body;
    if (Array.isArray(wishlist)) {
      req.user.wishlist = wishlist.map(item => item._id || item);
      await req.user.save();
    }
    res.json(req.user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      // Allow updating email only if it matches Firebase account email updates
      user.email = req.body.email || user.email;
      
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        addresses: updatedUser.addresses || [],
        wishlist: updatedUser.wishlist || []
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Address Management - Add Address
router.post('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      const address = {
        name: req.body.name,
        phone: req.body.phone,
        streetAddress: req.body.streetAddress,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        isDefault: req.body.isDefault || false
      };

      if (address.isDefault) {
        user.addresses.forEach(addr => addr.isDefault = false);
      }

      user.addresses.push(address);
      await user.save();
      res.status(201).json(user.addresses);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update address
router.put('/addresses/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      const address = user.addresses.id(req.params.id);
      if (address) {
        address.name = req.body.name || address.name;
        address.phone = req.body.phone || address.phone;
        address.streetAddress = req.body.streetAddress || address.streetAddress;
        address.city = req.body.city || address.city;
        address.state = req.body.state || address.state;
        address.postalCode = req.body.postalCode || address.postalCode;
        address.isDefault = req.body.isDefault !== undefined ? req.body.isDefault : address.isDefault;

        if (req.body.isDefault) {
          user.addresses.forEach(addr => {
            if (addr._id.toString() !== req.params.id) {
              addr.isDefault = false;
            }
          });
        }

        await user.save();
        res.json(user.addresses);
      } else {
        res.status(404).json({ message: 'Address not found' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Address
router.delete('/addresses/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
      await user.save();
      res.json(user.addresses);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
