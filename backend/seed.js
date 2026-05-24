const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Product, Category, Banner, Coupon, User, Review } = require('./models');

dotenv.config();

const categoriesData = [
  { name: 'Handcrafted Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { name: 'Designer Lehengas', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600' },
  { name: 'Royal Anarkalis', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600' },
  { name: 'Jaipur Fusion Wear', image: 'https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=600' },
  { name: 'Artisan Jackets & Dupattas', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600' }
];

const productsData = [
  {
    name: 'Royale Jaipur Gota Patti Saree',
    description: 'A breathtaking royal georgette saree, hand-embellished by Jaipur heritage artisans. Features detailed gota-patti embroidery borders, traditional hand-block floral motifs, and delicate hand-stitched gold sequins. Fits elegantly for festive banquets and weddings.',
    price: 18999,
    discountPrice: 14999,
    category: 'Handcrafted Sarees',
    subcategory: 'Gota Patti Sarees',
    brand: 'Mradhul Jaipur',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
    sizes: ['Free Size'],
    colors: ['#E01A4F', '#D4AF37'], // Crimson, Metallic Gold
    stock: 12,
    rating: 4.9,
    numReviews: 0,
    isTrending: true,
    isFlashSale: false,
    fabricMaterial: 'Pure Georgette & Silk Borders',
    sku: 'MF-SAREE-GP-001',
    deliveryInfo: 'Ships within 24-48 hours. Free express delivery across India.',
    returnPolicy: '7-day hassle-free returns for unused items with original tags.',
    specifications: [
      { key: 'Work', value: 'Handcrafted Gota Patti & Zardozi' },
      { key: 'Length', value: '5.5 meters saree + 0.8 meters blouse piece' },
      { key: 'Occasion', value: 'Bridal, Wedding, Festive' },
      { key: 'Dry Clean Only', value: 'Yes' }
    ]
  },
  {
    name: 'Heritage Banarasi Silk Kadhwa Saree',
    description: 'Woven with pure gold and silver zari threads on fine mulberry silk. This Banarasi masterpiece exhibits heritage floral buttis (Kadhwa weave) and an ornamental pallu, handcrafted by native weavers. A timeless heirloom saree.',
    price: 24999,
    discountPrice: 21999,
    category: 'Handcrafted Sarees',
    subcategory: 'Banarasi Silk',
    brand: 'Mradhul Jaipur',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'],
    sizes: ['Free Size'],
    colors: ['#800020', '#006400'], // Burgundy, Dark Green
    stock: 8,
    rating: 5.0,
    numReviews: 0,
    isTrending: true,
    isFlashSale: false,
    fabricMaterial: '100% Pure Katan Silk',
    sku: 'MF-SAREE-BN-002',
    deliveryInfo: 'Ships within 3 days. Secured transit with signature delivery.',
    returnPolicy: 'Heirloom collection. Returnable within 7 days in pristine condition.',
    specifications: [
      { key: 'Weave Type', value: 'Kadhwa Handloom Weave' },
      { key: 'Zari Type', value: 'Pure Gold & Silver Zari' },
      { key: 'Weight', value: '850 grams' },
      { key: 'Origin', value: 'Varanasi Weaving Clusters' }
    ]
  },
  {
    name: 'Shahi Zardozi Bridal Lehenga',
    description: 'A masterpiece of royal bridal couture. Tailored in pure raw silk with heavy zardozi, hand-woven gold dori, and real semi-precious bead embellishments. The flare is detailed with traditional palace arch motifs handcrafted by Jaipur master artisans over 300 hours.',
    price: 49999,
    discountPrice: 42999,
    category: 'Designer Lehengas',
    subcategory: 'Bridal Lehenga',
    brand: 'Mradhul Jaipur',
    images: ['https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=800'],
    sizes: ['S', 'M', 'L'],
    colors: ['#701122', '#D4AF37'], // Maroon, Antique Gold
    stock: 5,
    rating: 4.8,
    numReviews: 0,
    isTrending: true,
    isFlashSale: false,
    fabricMaterial: 'Pure Raw Silk with Satin Lining',
    sku: 'MF-LEH-SZ-001',
    deliveryInfo: 'Couture item. Ships within 14 days after custom sizing verification.',
    returnPolicy: 'Custom orders are final sale. Complimentary alterations included.',
    specifications: [
      { key: 'Work Type', value: 'Dabka, Zardozi & Resham Hand embroidery' },
      { key: 'Set Contents', value: 'Semi-stitched Lehenga, Blouse Fabric, Double Dupatta' },
      { key: 'Flare Length', value: '4.2 meters' },
      { key: 'Origin', value: 'Mradhul Couture Atelier, Jaipur' }
    ]
  },
  {
    name: 'Shahi Mughal Silk Anarkali Suit',
    description: 'Crafted in pure hand-loomed Banarasi silk, this elegant floor-length Anarkali set features a heavily embroidered bodice with fine mirror work, gold dori, and zardozi borders. Accompanied by silk pants and a sheer organza dupatta.',
    price: 15999,
    discountPrice: 13499,
    category: 'Royal Anarkalis',
    subcategory: 'Silk Anarkali',
    brand: 'Mradhul Jaipur',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#4B0082', '#E01A4F'], // Indigo, Crimson
    stock: 10,
    rating: 4.7,
    numReviews: 0,
    isTrending: true,
    isFlashSale: false,
    fabricMaterial: 'Banarasi Silk Ghera, Cotton Satin Lining',
    sku: 'MF-ANA-SM-001',
    deliveryInfo: 'Ships within 3-5 business days.',
    returnPolicy: '7-day standard return window.',
    specifications: [
      { key: 'Suit Style', value: 'Floor Length Anarkali Gown' },
      { key: 'Embroidery', value: 'Gota-patti & Glass Mirror Embellishments' },
      { key: 'Dupatta Fabric', value: 'Sheer Organza with scalloped borders' }
    ]
  },
  {
    name: 'Sanganeri Print Peplum Coord Set',
    description: 'A premium Jaipur fusion set featuring a hand-block Sanganeri printed peplum top with hand-stitched dabka outlines along the neckline, paired with floating Georgette palazzo pants.',
    price: 8999,
    discountPrice: 6999,
    category: 'Jaipur Fusion Wear',
    subcategory: 'Palazzo Sets',
    brand: 'Mradhul Jaipur',
    images: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#E6D7C3', '#4682B4'], // Off-White Block Print, Steel Blue
    stock: 18,
    rating: 4.5,
    numReviews: 0,
    isTrending: false,
    isFlashSale: true,
    flashSaleEndsAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
    fabricMaterial: 'Premium Hand-Block Cotton & Georgette',
    sku: 'MF-FUS-SP-001',
    deliveryInfo: 'Ships within 24 hours. Express delivery available.',
    returnPolicy: '15-day exchange and returns.',
    specifications: [
      { key: 'Print Type', value: 'Hand-block Sanganeri Print' },
      { key: 'Set Contents', value: 'Peplum Top & Flared Palazzos' },
      { key: 'Fabric Care', value: 'Gentle hand wash separately in cold water' }
    ]
  },
  {
    name: 'Royal Bandhej Pure Gajji Silk Dupatta',
    description: 'Traditional Rajasthani hand-tied Bandhani dupatta in premium Gajji silk. Features a rich crimson and mustard colorway, detailed with hand-loomed gold lagri-patta borders. An heirloom-quality accessory.',
    price: 5999,
    discountPrice: 4499,
    category: 'Artisan Jackets & Dupattas',
    subcategory: 'Dupattas',
    brand: 'Mradhul Jaipur',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
    sizes: ['Free Size'],
    colors: ['#E01A4F', '#FFA500'], // Crimson Red, Mustard Orange
    stock: 30,
    rating: 4.6,
    numReviews: 0,
    isTrending: false,
    isFlashSale: false,
    fabricMaterial: '100% Pure Gajji Silk',
    sku: 'MF-DUP-RB-001',
    deliveryInfo: 'Ships within 24-48 hours.',
    returnPolicy: '7-day standard returns.',
    specifications: [
      { key: 'Tie-Dye technique', value: 'Traditional Knot-tied Bandhej' },
      { key: 'Border', value: 'Gold Zari Lagri Patta' },
      { key: 'Length', value: '2.5 meters' }
    ]
  }
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is required before running seed scripts.');
    }
    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoURI);
    console.log('Connected. Clearing collections...');

    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Banner.deleteMany({});
    await Coupon.deleteMany({});
    await Review.deleteMany({});

    console.log('Collections cleared. Seeding categories...');
    await Category.insertMany(categoriesData);

    console.log('Seeding products...');
    await Product.insertMany(productsData);

    console.log('Seeding banners...');
    await Banner.create([
      { title: 'The Royal Jaipur Heritage Collection', image: '/banner_ethnic.png', link: '/products?category=Handcrafted%20Sarees' },
      { title: 'Intricate Handcrafted Bridal Couture', image: '/banner_western.png', link: '/products?category=Designer%20Lehengas' }
    ]);

    console.log('Database Seeding Completed Successfully! Exiting...');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
};

seedDB();
