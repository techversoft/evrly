import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a file buffer to Cloudinary.
 * Falls back to placeholder URLs if Cloudinary is not configured.
 * @param {Buffer} fileBuffer 
 * @param {String} folder 
 * @returns {Promise<String>} Image URL
 */
export const uploadToCloudinary = (fileBuffer, folder = 'surprizo') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      if (process.env.NODE_ENV === 'production') {
        return reject(new Error('Cloudinary credentials are not configured in production mode.'));
      }
      console.warn('Cloudinary environment variables not set. Using beautiful fallback placeholder image.');
      const fallbacks = [
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',
        'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
        'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800',
        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800',
      ];
      const randomUrl = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return resolve(randomUrl);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};
export default uploadToCloudinary;
