import express from 'express';
import { 
  registerUser, 
  authUser, 
  googleLogin, 
  getUserProfile, 
  becomeSeller,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, authUser);
router.post('/google-login', authLimiter, googleLogin);
router.get('/me', protect, getUserProfile);
router.post('/become-seller', protect, becomeSeller);

// Profile & Address Management
router.put('/profile', protect, updateUserProfile);

router.route('/addresses')
  .get(protect, getUserAddresses)
  .post(protect, addUserAddress);

router.route('/addresses/:addressId')
  .put(protect, updateUserAddress)
  .delete(protect, deleteUserAddress);

// Wishlist
router.route('/wishlist')
  .get(protect, getWishlist)
  .post(protect, addToWishlist);

router.route('/wishlist/:productId')
  .delete(protect, removeFromWishlist);

export default router;
