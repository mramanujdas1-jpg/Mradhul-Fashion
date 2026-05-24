const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { protect, admin } = require('../auth');
const { sendPushNotification } = require('../services/notificationService');

// Register FCM Token for current logged in user
router.post('/subscribe', protect, async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }

    // Prevent duplicate entries
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.json({ message: 'Subscribed to push notifications successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Send Notification to All Users via scalable FCM
router.post('/send-broadcast', protect, admin, async (req, res) => {
  const { title, body, data } = req.body;
  if (!title || !body) {
    return res.status(400).json({ message: 'Title and body are required' });
  }

  try {
    // Find all users who have registered tokens
    const users = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } });
    const allTokens = users.flatMap(u => u.fcmTokens || []);

    if (allTokens.length === 0) {
      return res.json({ message: 'No registered devices found to broadcast.' });
    }

    const fcmResult = await sendPushNotification(allTokens, title, body, data);

    res.json({
      message: `Broadcast queued successfully`,
      receiversCount: allTokens.length,
      fcmResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
