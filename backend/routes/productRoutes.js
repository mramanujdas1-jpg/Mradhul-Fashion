const express = require('express');
const router = express.Router();
const { Product, Review } = require('../models');
const { protect, admin, approvedSeller } = require('../auth');

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const normalizeOptionalSku = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizeProductSku = (data) => {
  if (data && hasOwn(data, 'sku')) {
    data.sku = normalizeOptionalSku(data.sku);
  }
};

// Get All Products (with advanced filter, search & sorting)
router.get('/', async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 12;
  const page = Number(req.query.page) || 1;

  const queryObj = {};

  // Search keyword (name or description)
  if (req.query.keyword) {
    queryObj.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { description: { $regex: req.query.keyword, $options: 'i' } }
    ];
  }

  // Category filter
  if (req.query.category) {
    queryObj.category = req.query.category;
  }

  // Subcategory filter (supports multi-select comma separated)
  if (req.query.subcategory) {
    const subcats = req.query.subcategory.split(',').map(s => s.trim());
    queryObj.subcategory = { $in: subcats };
  }

  // Brand filter (supports multi-select)
  if (req.query.brand) {
    const brands = req.query.brand.split(',').map(b => b.trim());
    queryObj.brand = { $in: brands };
  }

  // Sizes filter (supports multi-select)
  if (req.query.sizes) {
    const sizesList = req.query.sizes.split(',').map(s => s.trim());
    queryObj.sizes = { $in: sizesList };
  }

  // Colors filter (supports multi-select)
  if (req.query.colors) {
    const colorsList = req.query.colors.split(',').map(c => c.trim());
    queryObj.colors = { $in: colorsList };
  }

  // Fabric filter (supports multi-select)
  if (req.query.fabric) {
    const fabricList = req.query.fabric.split(',').map(f => f.trim());
    queryObj.fabricMaterial = { $in: fabricList.map(f => new RegExp(f, 'i')) };
  }

  // Price range filters
  if (req.query.minPrice || req.query.maxPrice) {
    queryObj.price = {};
    if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
  }

  // Rating filter
  if (req.query.rating) {
    queryObj.rating = { $gte: Number(req.query.rating) };
  }

  // Badges
  if (req.query.trending === 'true') {
    queryObj.isTrending = true;
  }
  if (req.query.flashSale === 'true') {
    queryObj.isFlashSale = true;
  }

  let sortObj = { createdAt: -1 }; // default newest
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'price-asc':
      case 'price-low':
        sortObj = { price: 1 };
        break;
      case 'price-desc':
      case 'price-high':
        sortObj = { price: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1 };
        break;
      case 'best-sellers':
      case 'best-seller':
        sortObj = { numReviews: -1, rating: -1 };
        break;
      case 'trending':
        sortObj = { isTrending: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }
  }

  try {
    const count = await Product.countDocuments(queryObj);
    const products = await Product.find(queryObj)
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort(sortObj);

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Single Product by Slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
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
  const { rating, comment, images } = req.body;
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

      // Check if user has a delivered order with this product
      const Order = require('../models').Order;
      const verifiedPurchase = await Order.exists({
        user: req.user._id,
        status: 'Delivered',
        'orderItems.product': req.params.id
      });

      const review = await Review.create({
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
        product: req.params.id,
        verifiedPurchase: !!verifiedPurchase,
        images: Array.isArray(images) ? images : []
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

// Mark review as helpful (Toggle)
router.post('/reviews/:reviewId/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userId = req.user._id;
    const alreadyUpvoted = review.helpfulUsers && review.helpfulUsers.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyUpvoted) {
      review.helpfulUsers = review.helpfulUsers.filter(
        (id) => id.toString() !== userId.toString()
      );
      review.helpfulCount = Math.max(0, (review.helpfulCount || 1) - 1);
      await review.save();
      return res.json({ message: 'Helpful vote removed', helpfulCount: review.helpfulCount, upvoted: false });
    } else {
      if (!review.helpfulUsers) review.helpfulUsers = [];
      review.helpfulUsers.push(userId);
      review.helpfulCount = (review.helpfulCount || 0) + 1;
      await review.save();
      return res.json({ message: 'Review marked helpful', helpfulCount: review.helpfulCount, upvoted: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seller/Admin: Get All Seller Products
router.get('/seller/mine', protect, approvedSeller, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { seller: req.user._id };
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seller/Admin: Create Product
router.post('/', protect, approvedSeller, async (req, res) => {
  try {
    const productData = req.body;
    normalizeProductSku(productData);
    
    // Set some defaults if missing
    if (!productData.name) productData.name = 'Sample Product';
    if (!productData.description) productData.description = 'Sample Description';
    if (!productData.category) productData.category = 'General';
    if (!productData.brand) productData.brand = 'Mradhul';
    
    // Enforce logged-in user as the product owner (seller)
    productData.seller = req.user._id;

    // Ensure stockPerSize is correctly formatted as an object
    if (productData.stockPerSize && typeof productData.stockPerSize === 'object') {
      // It's already an object, mongoose Map handles it
    } else {
      productData.stockPerSize = {};
    }

    const product = new Product(productData);
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seller/Admin: Update Product
router.put('/:id', protect, approvedSeller, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      // Enforce seller isolation
      if (product.seller && product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized: you can only update your own products' });
      } else if (!product.seller && req.user.role !== 'admin') {
         return res.status(403).json({ message: 'Not authorized: legacy product missing seller ID' });
      }

      const updateData = req.body;
      const skuProvided = hasOwn(updateData, 'sku');
      normalizeProductSku(updateData);
      
      const allowedFields = [
        'name', 'slug', 'shortDescription', 'description', 'price', 'discountPrice', 'category', 
        'subcategory', 'brand', 'tags', 'gender', 'fabricMaterial', 'material', 'careInstructions',
        'images', 'variantImages', 'sizes', 'colors', 'stock', 'stockPerSize', 'sku',
        'isTrending', 'isFlashSale', 'flashSaleEndsAt', 'specifications', 'deliveryInfo', 'returnPolicy'
      ];

      allowedFields.forEach(field => {
        if (field === 'sku' && skuProvided) {
          product[field] = updateData[field];
        } else if (updateData[field] !== undefined) {
          product[field] = updateData[field];
        }
      });

      // Fix for legacy products: automatically assign current admin as seller before save
      if (!product.seller) {
        product.seller = req.user._id;
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seller/Admin: Delete Product
router.delete('/:id', protect, approvedSeller, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      // Enforce seller isolation
      if (product.seller && product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized: you can only delete your own products' });
      } else if (!product.seller && req.user.role !== 'admin') {
         return res.status(403).json({ message: 'Not authorized: legacy product missing seller ID' });
      }

      // Delete images from Cloudinary if configured and exist
      if (product.images && product.images.length > 0 && process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          const cloudinary = require('cloudinary').v2;
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
          });

          for (const imageUrl of product.images) {
            if (imageUrl.includes('res.cloudinary.com')) {
              try {
                const parts = imageUrl.split('/');
                const folderIndex = parts.indexOf('mradhul_fashion');
                if (folderIndex > -1) {
                  const subParts = parts.slice(folderIndex);
                  const publicIdWithExt = subParts.join('/');
                  const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
                  
                  await cloudinary.uploader.destroy(publicId);
                  console.log(`Successfully deleted Cloudinary image: ${publicId}`);
                }
              } catch (destroyErr) {
                console.error(`Failed to delete Cloudinary image: ${imageUrl}`, destroyErr.message);
              }
            }
          }
        } catch (cloudinaryErr) {
          console.error('Failed to configure or invoke Cloudinary uploader destruction:', cloudinaryErr.message);
        }
      }

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
