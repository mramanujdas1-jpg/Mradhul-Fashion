const express = require('express');
const router = express.Router();
const { Banner } = require('../models');
const { protect, admin } = require('../auth');

// Get All Active Banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Create Banner
router.post('/', protect, admin, async (req, res) => {
  const { title, image, link, isActive } = req.body;
  try {
    const banner = await Banner.create({ title, image, link, isActive });
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Toggle/Update Banner
router.put('/:id', protect, admin, async (req, res) => {
  const { title, image, link, isActive } = req.body;
  try {
    const banner = await Banner.findById(req.params.id);
    if (banner) {
      banner.title = title || banner.title;
      banner.image = image || banner.image;
      banner.link = link || banner.link;
      if (isActive !== undefined) banner.isActive = isActive;

      const updatedBanner = await banner.save();
      res.json(updatedBanner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete Banner
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (banner) {
      await Banner.findByIdAndDelete(req.params.id);
      res.json({ message: 'Banner removed' });
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
