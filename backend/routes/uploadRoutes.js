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

  let attempt = 0;
  const maxRetries = 3;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'mradhul_fashion',
        resource_type: 'image',
        format: 'webp',
        timeout: 60000, // 60 seconds timeout
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
      console.warn(`Cloudinary upload attempt ${attempt + 1} failed:`, error.message);
      lastError = error;
      attempt++;
      if (attempt < maxRetries) {
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.error('Cloudinary upload failed after retries:', lastError.message);
  return res.status(500).json({ message: 'Cloudinary upload failed: ' + lastError.message });
});

module.exports = router;
