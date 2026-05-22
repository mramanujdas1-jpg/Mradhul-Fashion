const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { User, Product, Category, Banner, Coupon } = require('./models');

dotenv.config();

const categoriesData = [
  { name: 'Handcrafted Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { name: 'Designer Lehengas', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600' },
  { name: 'Royal Anarkalis', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600' },
  { name: 'Jaipur Fusion Wear', image: 'https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=600' },
  { name: 'Bridal & Festive', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { name: 'Artisan Jackets & Dupattas', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600' }
];

const productsData = [
  {
    name: 'Royale Jaipur Gota Patti Saree',
    description: 'A breathtaking royal georgette saree, hand-embellished by Jaipur heritage artisans. Features detailed gota-patti embroidery borders, traditional hand-block floral motifs, and delicate hand-stitched gold sequins. Fits elegantly for festive banquets and weddings.',
    price: 18999,
    discountPrice: 14999,
    category: 'Handcrafted Sarees',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
    sizes: ['Free Size'],
    stock: 12,
    rating: 4.9,
    numReviews: 24,
    isTrending: true,
    isFlashSale: false
  },
  {
    name: 'Heritage Leheriya Silk Anarkali',
    description: 'This royal tie-dye Leheriya Anarkali suit set is crafted from pure hand-loomed Banarasi silk. Embellished with fine mirror embroidery and gold zardozi work along the neck and flare. Includes matching churidar and a sheer chiffon dupatta.',
    price: 14499,
    discountPrice: 11999,
    category: 'Royal Anarkalis',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 15,
    rating: 4.8,
    numReviews: 16,
    isTrending: true,
    isFlashSale: false
  },
  {
    name: 'Shahi Zardozi Bridal Lehenga',
    description: 'A masterpiece of royal bridal couture. Tailored in pure mulberry raw silk with heavy zardozi, hand-woven gold dori, and real semi-precious bead embellishments. The flare is detailed with traditional palace arch motifs handcrafted by Jaipur master artisans over 300 hours.',
    price: 49999,
    discountPrice: 42999,
    category: 'Bridal & Festive',
    images: ['https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=800'],
    sizes: ['S', 'M', 'L'],
    stock: 5,
    rating: 5.0,
    numReviews: 10,
    isTrending: true,
    isFlashSale: false
  },
  {
    name: 'Sanganeri Print Peplum & Palazzo Set',
    description: 'A contemporary fusion coordinate set featuring a Sanganeri block printed peplum top with hand-embellished dabka outlines, paired with lightweight floating georgette palazzo pants.',
    price: 8999,
    discountPrice: 6999,
    category: 'Jaipur Fusion Wear',
    images: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 18,
    rating: 4.5,
    numReviews: 14,
    isTrending: false,
    isFlashSale: true,
    flashSaleEndsAt: new Date(Date.now() + 18 * 60 * 60 * 1000)
  },
  {
    name: 'Shekhawati Hand-Embroidered Velvet Jacket',
    description: 'A luxurious velvet jacket intricately detailed with traditional Shekhawati hand-embroidery. Embellished with fine dabka threadwork, mirror details, and brass buttons. Perfect to layer over modern or traditional ethnic ensembles.',
    price: 12999,
    discountPrice: 9999,
    category: 'Artisan Jackets & Dupattas',
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 8,
    rating: 4.9,
    numReviews: 9,
    isTrending: true,
    isFlashSale: false
  },
  {
    name: 'Royal Bandhej Pure Gajji Silk Dupatta',
    description: 'Traditional Rajasthani hand-tied Bandhani dupatta in pure Gajji silk. Features a rich wedding crimson and mustard colorway, detailed with hand-loomed gold zari borders. An heirloom-quality accessory.',
    price: 5999,
    discountPrice: 4499,
    category: 'Artisan Jackets & Dupattas',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
    sizes: ['Free Size'],
    stock: 30,
    rating: 4.6,
    numReviews: 18,
    isTrending: false,
    isFlashSale: false
  },
  {
    name: 'Jaipur Meenakari Embroidered Lehenga',
    description: 'A luxurious designer lehenga set in raw mulberry silk, featuring heavy zardozi, gold dori, and pearl hand-embroidery. The motifs are intricately inspired by traditional Rajasthani Meenakari jewelry designs.',
    price: 34999,
    discountPrice: 29999,
    category: 'Designer Lehengas',
    images: ['https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=800'],
    sizes: ['S', 'M', 'L'],
    stock: 6,
    rating: 4.9,
    numReviews: 12,
    isTrending: true,
    isFlashSale: false
  },
  {
    name: 'Maharani Hand-Block Silk Gown',
    description: 'An elegant long gown handcrafted from premium hand-block printed Chanderi silk. Features soft cotton lining, intricate Gota-patti handwork around the neckline and borders, and a matching sheer organza dupatta.',
    price: 15999,
    discountPrice: 12499,
    category: 'Bridal & Festive',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 10,
    rating: 4.7,
    numReviews: 15,
    isTrending: true,
    isFlashSale: false
  }
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mradhul_fashion';
    console.log('Connecting to MongoDB at:', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('Connected to Database. Clearing existing collections...');

    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Banner.deleteMany({});
    await Coupon.deleteMany({});

    console.log('Collections cleared. Inserting Seed Data...');

    // Seed Categories
    await Category.insertMany(categoriesData);
    console.log('Categories seeded.');

    // Seed Products
    await Product.insertMany(productsData);
    console.log('Products seeded.');

    // Create Default Admin & Customer Account
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const customerPassword = await bcrypt.hash('user123', salt);

    await User.create({
      name: 'Mradhul Admin',
      email: 'admin@mradhulfashion.com',
      password: adminPassword,
      role: 'admin',
      addresses: [
        {
          name: 'Mradhul Fashion Head Office',
          phone: '9876543210',
          streetAddress: 'Mradhul Mansion, Johari Bazaar',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302003',
          isDefault: true
        }
      ]
    });

    await User.create({
      name: 'Sample Customer',
      email: 'customer@mradhulfashion.com',
      password: customerPassword,
      role: 'customer',
      addresses: [
        {
          name: 'Devi Sharma',
          phone: '9998887776',
          streetAddress: 'Flat 402, Royal Residency, C-Scheme',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
          isDefault: true
        }
      ]
    });
    console.log('Users seeded (admin@mradhulfashion.com / admin123, customer@mradhulfashion.com / user123).');

    // Seed Banners
    await Banner.create([
      { title: 'The Royal Jaipur Heritage', image: '/banner_ethnic.png', link: '/products?category=Handcrafted%20Sarees' },
      { title: 'Intricate Handcrafted Bridal Wear', image: '/banner_western.png', link: '/products?category=Designer%20Lehengas' }
    ]);
    console.log('Banners seeded.');

    // Seed Coupons
    await Coupon.create([
      { code: 'ROYAL10', discountPercentage: 10, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { code: 'JAIPUR20', discountPercentage: 20, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { code: 'WELCOMELUXE', discountPercentage: 15, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    ]);
    console.log('Coupons seeded.');

    console.log('Database Seeding Completed Successfully! Exiting...');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
};

seedDB();
