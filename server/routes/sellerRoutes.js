import express from 'express';
import {
  getSellerDashboard,
  getSellerOrders,
  updateOrderItemStatus,
  getSellerProducts,
  getSellerPayouts,
  createPayoutRequest,
} from '../controllers/sellerController.js';
import { protect, seller, approvedSeller } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(seller); // Restrict to sellers only

// Dashboard is allowed for unapproved sellers (to display status)
router.get('/dashboard', getSellerDashboard);

// Restrict these routes to approved sellers only
router.get('/orders', approvedSeller, getSellerOrders);
router.put('/orders/:orderId/item/:productId', approvedSeller, updateOrderItemStatus);
router.get('/products', approvedSeller, getSellerProducts);
router.get('/payouts', approvedSeller, getSellerPayouts);
router.post('/payouts/request', approvedSeller, createPayoutRequest);

export default router;
