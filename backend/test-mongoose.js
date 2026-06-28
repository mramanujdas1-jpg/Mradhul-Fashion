const mongoose = require('mongoose');
const { Product, User } = require('./models');

const test = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mradhul_fashion');
    console.log("Connected to local DB");

    // Ensure we have a user
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        name: "Test Admin",
        email: "test@example.com",
        role: "admin"
      });
      console.log("Created test user");
    }

    // Ensure we have a product
    let product = await Product.findOne();
    if (!product) {
      product = await Product.create({
        name: "Legacy Product",
        description: "Test description",
        price: 100,
        category: "Test",
        images: ["http://test.com/img.jpg"],
        seller: user._id
      });
      console.log("Created test product");
    } else {
      console.log("Found existing product:", product.name);
    }

    // Try to update it the exact way the PUT route does
    const updateData = {
      name: "Updated Name",
      price: "150", // Frontend might send string
      stockPerSize: {
        "S": 10,
        "M": "5", // Might be string
      }
    };

    const allowedFields = [
      'name', 'slug', 'shortDescription', 'description', 'price', 'discountPrice', 'category', 
      'subcategory', 'brand', 'tags', 'gender', 'fabricMaterial', 'material', 'careInstructions',
      'images', 'variantImages', 'sizes', 'colors', 'stock', 'stockPerSize', 'sku',
      'isTrending', 'isFlashSale', 'flashSaleEndsAt', 'specifications', 'deliveryInfo', 'returnPolicy'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        product[field] = updateData[field];
      }
    });

    if (!product.seller) {
      product.seller = user._id;
    }

    console.log("Attempting save...");
    const updated = await product.save();
    console.log("Save successful!");
  } catch (error) {
    console.error("Save failed!");
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
};

test();
