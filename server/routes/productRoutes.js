import express from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  uploadImage,
} from '../controllers/productController.js';
import { protect, seller, approvedSeller } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', upload.single('image'), uploadImage);

router.route('/')
  .get(getProducts)
  .post(protect, approvedSeller, upload.array('images', 5), createProduct);

router.route('/:slug')
  .get(getProductBySlug);

router.route('/:id')
  .put(protect, approvedSeller, upload.array('images', 5), updateProduct)
  .delete(protect, approvedSeller, deleteProduct);

router.route('/:id/reviews')
  .post(protect, createProductReview);

export default router;
