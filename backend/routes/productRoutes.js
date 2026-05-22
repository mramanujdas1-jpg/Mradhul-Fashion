const express = require('express');
const router = express.Router();
const { Product, Review } = require('../models');
const { protect, admin } = require('../auth');

// Get All Products (with filter & search)
router.get('/', async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 12;
  const page = Number(req.query.page) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { description: { $regex: req.query.keyword, $options: 'i' } }
        ]
      }
    : {};

  const category = req.query.category ? { category: req.query.category } : {};
  const isTrending = req.query.trending === 'true' ? { isTrending: true } : {};
  const isFlashSale = req.query.flashSale === 'true' ? { isFlashSale: true } : {};

  // Price range filters
  let priceFilter = {};
  if (req.query.minPrice || req.query.maxPrice) {
    priceFilter.price = {};
    if (req.query.minPrice) priceFilter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) priceFilter.price.$lte = Number(req.query.maxPrice);
  }

  // Rating filter
  const rating = req.query.rating ? { rating: { $gte: Number(req.query.rating) } } : {};

  // Combine filters
  const filter = { ...keyword, ...category, ...isTrending, ...isFlashSale, ...priceFilter, ...rating };

  try {
    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Single Product & reviews
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });
      res.json({ product, reviews });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Review
router.post('/:id/reviews', protect, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const alreadyReviewed = await Review.findOne({
        product: req.params.id,
        user: req.user._id
      });

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed' });
      }

      const review = await Review.create({
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
        product: req.params.id
      });

      // Update product rating average
      const reviews = await Review.find({ product: req.params.id });
      product.numReviews = reviews.length;
      product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added', review });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Create Product
router.post('/', protect, admin, async (req, res) => {
  const { name, price, discountPrice, description, images, category, sizes, stock, isTrending, isFlashSale, flashSaleEndsAt } = req.body;
  try {
    const product = new Product({
      name: name || 'Sample Product',
      price: price || 0,
      discountPrice: discountPrice || 0,
      description: description || 'Sample Description',
      images: images && images.length ? images : ['/logo.png'],
      category: category || 'General',
      sizes: sizes || ['S', 'M', 'L', 'XL'],
      stock: stock || 0,
      isTrending: isTrending || false,
      isFlashSale: isFlashSale || false,
      flashSaleEndsAt: flashSaleEndsAt || null
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update Product
router.put('/:id', protect, admin, async (req, res) => {
  const { name, price, discountPrice, description, images, category, sizes, stock, isTrending, isFlashSale, flashSaleEndsAt } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.price = price !== undefined ? price : product.price;
      product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
      product.description = description || product.description;
      if (images) product.images = images;
      product.category = category || product.category;
      if (sizes) product.sizes = sizes;
      product.stock = stock !== undefined ? stock : product.stock;
      product.isTrending = isTrending !== undefined ? isTrending : product.isTrending;
      product.isFlashSale = isFlashSale !== undefined ? isFlashSale : product.isFlashSale;
      product.flashSaleEndsAt = flashSaleEndsAt !== undefined ? flashSaleEndsAt : product.flashSaleEndsAt;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete Product
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await Product.findByIdAndDelete(req.params.id);
      await Review.deleteMany({ product: req.params.id });
      res.json({ message: 'Product and associated reviews removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
