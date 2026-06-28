const express = require('express');
const router = express.Router();
const { NewsletterSubscriber } = require('../models');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.source = req.body?.source || existing.source || 'footer';
        await existing.save();
      }
      return res.status(200).json({ message: 'You are already subscribed.' });
    }

    await NewsletterSubscriber.create({
      email,
      source: req.body?.source || 'footer'
    });

    res.status(201).json({ message: 'Thank you for subscribing to Mradhul Fashion updates.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ message: 'You are already subscribed.' });
    }
    res.status(500).json({ message: 'Unable to save your subscription right now.' });
  }
});

module.exports = router;
