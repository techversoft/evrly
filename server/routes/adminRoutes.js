import express from 'express';
import {
  getAdminDashboard,
  getUsers,
  updateUserRole,
  getPendingSellers,
  approveSeller,
  getPendingProducts,
  approveProduct,
  getAdminOrders,
  updateAdminOrderStatus,
  getAllPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  getSellers,
  suspendSeller,
  updateSellerCommission,
} from '../controllers/adminController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(admin); // Restrict to admin only

router.get('/dashboard', getAdminDashboard);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

router.get('/sellers', getSellers);
router.get('/sellers/pending', getPendingSellers);
router.put('/sellers/:id/approve', approveSeller);
router.put('/sellers/:id/suspend', suspendSeller);
router.put('/sellers/:id/commission', updateSellerCommission);

router.get('/products/pending', getPendingProducts);
router.put('/products/:id/approve', approveProduct);

router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateAdminOrderStatus);

router.get('/payouts', getAllPayoutRequests);
router.put('/payouts/:id/approve', approvePayoutRequest);
router.put('/payouts/:id/reject', rejectPayoutRequest);

export default router;
