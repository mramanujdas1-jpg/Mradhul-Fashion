const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const { User, Product, Order } = require('./models');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

console.log('Connecting to MongoDB database for migration...');
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB database successfully.');

    // 1. Find or create a default Admin User to associate existing products and orders
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No Admin user found. Creating a default Admin user...');
      adminUser = await User.create({
        name: 'Super Admin',
        email: 'admin@mradhulfashion.com',
        role: 'admin',
        firebaseUid: 'default-admin-uid-migration'
      });
      console.log(`Created default Admin User: ${adminUser.email} (ID: ${adminUser._id})`);
    } else {
      console.log(`Using existing Admin User: ${adminUser.email} (ID: ${adminUser._id})`);
    }

    // 2. Migrate existing Products that lack a 'seller' field
    const productsToMigrate = await Product.find({ seller: { $exists: false } });
    console.log(`Found ${productsToMigrate.length} products lacking seller ID.`);
    if (productsToMigrate.length > 0) {
      const updateResult = await Product.updateMany(
        { seller: { $exists: false } },
        { $set: { seller: adminUser._id } }
      );
      console.log(`Successfully migrated products:`, updateResult);
    }

    // 3. Migrate existing Orders that lack a 'seller' field
    const ordersToMigrate = await Order.find({ seller: { $exists: false } });
    console.log(`Found ${ordersToMigrate.length} orders lacking seller ID.`);
    if (ordersToMigrate.length > 0) {
      const updateResult = await Order.updateMany(
        { seller: { $exists: false } },
        { $set: { seller: adminUser._id } }
      );
      console.log(`Successfully migrated orders:`, updateResult);
    }

    console.log('Database migration completed successfully.');
    mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
