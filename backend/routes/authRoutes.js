const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateToken, protect } = require('../auth');

// Register User
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Make the first user an Admin for testing ease, otherwise customer
    const userCount = await User.countDocuments({});
    const role = userCount === 0 ? 'admin' : 'customer';

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
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
      user.email = req.body.email || user.email;
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }
      const updatedUser = await User.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Address Management
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
