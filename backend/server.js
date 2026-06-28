const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const couponRoutes = require('./routes/couponRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');


const app = express();

// CORS — explicitly whitelist the Vercel frontend and localhost dev
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://mradhulfashion.com',
  'https://www.mradhulfashion.com',
  'https://mradhulfashion.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin === o || origin.endsWith('.vercel.app'))) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Root API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Mradhul Fashion API is fully operational',
    timestamp: new Date()
  });
});

// Mounting API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Error Handling Middlewares
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is required. Configure MongoDB Atlas before starting the API.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(MONGO_URI)) {
  console.error('Production MONGO_URI cannot point to localhost. Configure the MongoDB Atlas URI in Railway.');
  process.exit(1);
}

console.log('Connecting to MongoDB Atlas...');
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connection established successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed. Exiting server...', err.message);
    process.exit(1);
  });
