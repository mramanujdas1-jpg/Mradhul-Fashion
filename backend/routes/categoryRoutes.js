const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { protect, admin } = require('../auth');

// Get All Categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Create Category
router.post('/', protect, admin, async (req, res) => {
  const { name, image } = req.body;
  try {
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name, image });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update Category
router.put('/:id', protect, admin, async (req, res) => {
  const { name, image } = req.body;
  try {
    const category = await Category.findById(req.params.id);
    if (category) {
      category.name = name || category.name;
      category.image = image || category.image;
      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete Category
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category) {
      await Category.findByIdAndDelete(req.params.id);
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
