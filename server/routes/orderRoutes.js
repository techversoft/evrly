import express from 'express';
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrderItem,
  returnOrderItem,
} from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all order routes

router.route('/')
  .post(createOrder);

router.route('/verify')
  .post(verifyPayment);

router.route('/my-orders')
  .get(getMyOrders);

router.route('/:orderId/cancel/:productId')
  .post(cancelOrderItem);

router.route('/:orderId/return/:productId')
  .post(returnOrderItem);

router.route('/:id')
  .get(getOrderById);

export default router;
