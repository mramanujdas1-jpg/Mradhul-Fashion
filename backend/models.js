const mongoose = require('mongoose');

// Address Schema
const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for OAuth/Firebase users
  firebaseUid: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
  sellerStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  sellerInfo: {
    storeName: { type: String },
    storeDescription: { type: String },
    phone: { type: String },
    gstin: { type: String },
    address: { type: String }
  },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, default: 1 },
    size: { type: String, required: true }
  }],
  fcmTokens: [{ type: String }]
}, { timestamps: true });

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String, required: true }
}, { timestamps: true });

// Product Schema
const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  shortDescription: { type: String },
  description: { type: String, required: true },
  price: { type: Number, required: true, default: 0 }, // Original Price
  discountPrice: { type: Number, default: 0 }, // Sale Price
  discountPercent: { type: Number, default: 0 },
  category: { type: String, required: true },
  subcategory: { type: String },
  brand: { type: String, required: true, default: 'Mradhul' },
  tags: [{ type: String }],
  gender: { type: String, enum: ['Men', 'Women', 'Kids', 'Unisex'], default: 'Women' },
  fabricMaterial: { type: String },
  material: { type: String },
  careInstructions: { type: String },
  images: [{ type: String, required: true }],
  variantImages: [{
    color: { type: String },
    images: [{ type: String }]
  }],
  sizes: [{ type: String }], // List of all sizes
  colors: [{ type: String }],
  stock: { type: Number, required: true, default: 0 }, // Total stock
  stockPerSize: {
    type: Map,
    of: Number,
    default: {}
  },
  sku: { type: String, unique: true, sparse: true },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isTrending: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  flashSaleEndsAt: { type: Date },
  specifications: [{ key: String, value: String }],
  deliveryInfo: { type: String },
  returnPolicy: { type: String }
}, { timestamps: true });

// Pre-save middleware to auto-calculate discount percent and generate slug if missing
productSchema.pre('save', function (next) {
  if (this.price > 0 && this.discountPrice > 0 && this.price > this.discountPrice) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  } else {
    this.discountPercent = 0;
  }
  
  if (!this.slug && this.name) {
    const base = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    // Append short ObjectId suffix to ensure global uniqueness across all products
    const suffix = this._id ? this._id.toString().slice(-6) : Math.random().toString(36).slice(2, 8);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

// Review Schema
const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [{ type: String }],
  verifiedPurchase: { type: Boolean, default: false },
  helpfulCount: { type: Number, default: 0 },
  helpfulUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Order Schema
const trackingStepSchema = new mongoose.Schema({
  status: { type: String, required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    size: { type: String, required: true }
  }],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  paymentMethod: { type: String, required: true, enum: ['COD', 'Razorpay'] },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: { type: Number, required: true, default: 0.0 },
  taxPrice: { type: Number, required: true, default: 0.0 },
  shippingPrice: { type: Number, required: true, default: 0.0 },
  totalPrice: { type: Number, required: true, default: 0.0 },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned'], 
    default: 'Pending' 
  },
  trackingSteps: [trackingStepSchema]
}, { timestamps: true });

// Banner Schema
const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  link: { type: String, default: '/products' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Coupon Schema
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Product: mongoose.model('Product', productSchema),
  Category: mongoose.model('Category', categorySchema),
  Review: mongoose.model('Review', reviewSchema),
  Order: mongoose.model('Order', orderSchema),
  Banner: mongoose.model('Banner', bannerSchema),
  Coupon: mongoose.model('Coupon', couponSchema)
};
