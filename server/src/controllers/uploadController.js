const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// POST /api/upload/sign
// Returns a timestamp + signature that authorizes ONE browser-to-Cloudinary upload.
//
// WHY sign server-side?
// Cloudinary needs to verify that uploads come from authorized clients.
// The signature is computed using your CLOUDINARY_API_SECRET which NEVER
// leaves the server. The browser uses the signature (not the secret) to upload.
// After the browser uploads the image, Cloudinary gives back a secure_url
// which you then save in your database.
async function signUpload(req, res, next) {
  try {
    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: 'restaurant-menu' },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: 'restaurant-menu'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { signUpload };
