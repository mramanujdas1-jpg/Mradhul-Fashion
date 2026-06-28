const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { protect } = require('../auth');

// Configure Cloudinary using env keys
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// POST /api/upload
// Receives a base64 encoded image string, uploads it to Cloudinary, and returns the secure URL
router.post('/', protect, async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ message: 'Base64 image payload is required' });
  }

  // Ensure Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return res.status(503).json({ message: 'Cloudinary upload service is not configured.' });
  }

  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("API Key exists:", !!process.env.CLOUDINARY_API_KEY);
  console.log("API Secret exists:", !!process.env.CLOUDINARY_API_SECRET);

  try {
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'mradhul_fashion',
      resource_type: 'image',
      format: 'webp',
      timeout: 60000,
      transformation: [
        { width: 1200, height: 1600, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return res.status(200).json({
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id
    });
  } catch (error) {
    console.dir(error, { depth: null });
    console.log(error.message);
    console.log(error.http_code);
    console.log(error.error);
    console.log(error.response);
    
    return res.status(500).json({ message: 'Cloudinary upload failed: ' + error.message });
  }
});

module.exports = router;
