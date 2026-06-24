import User from '../models/User.js';
import SellerProfile from '../models/SellerProfile.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import PayoutRequest from '../models/PayoutRequest.js';
import SellerBalance from '../models/SellerBalance.js';
import PayoutTransaction from '../models/PayoutTransaction.js';

// @desc    Get admin dashboard analytics and KPIs
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalSellers = await SellerProfile.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    
    // Earnings statistics
    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const totalSales = paidOrders.reduce((acc, order) => acc + order.totalAmount, 0);
    const totalOrdersCount = await Order.countDocuments({});

    // Calculate commission and payouts KPIs
    let totalItemSubtotals = 0;
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        totalItemSubtotals += item.price * item.quantity;
      });
    });
    
    // We fetch each seller profile to apply custom commissions if we want to be exact,
    // or calculate based on the total items subtotal. Let's calculate dynamically:
    let commissionEarnings = 0;
    for (const order of paidOrders) {
      for (const item of order.items) {
        const sellerProfile = await SellerProfile.findOne({ user: item.seller });
        const rate = sellerProfile ? sellerProfile.commissionRate : 10;
        commissionEarnings += (item.price * item.quantity) * (rate / 100);
      }
    }

    const payoutRequests = await PayoutRequest.find({});
    const totalPayouts = payoutRequests
      .filter(r => r.status === 'approved')
      .reduce((acc, r) => acc + r.amount, 0);
    const pendingPayoutsCount = payoutRequests.filter(r => r.status === 'pending').length;
    const pendingPayoutsAmount = payoutRequests
      .filter(r => r.status === 'pending')
      .reduce((acc, r) => acc + r.amount, 0);

    // Monthly platform sales distribution (this year)
    const monthlySales = Array(12).fill(0);
    paidOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const month = orderDate.getMonth();
      monthlySales[month] += order.totalAmount;
    });

    // Recent orders
    const recentOrders = await Order.find({})
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent registered sellers
    const pendingSellersCount = await SellerProfile.countDocuments({ isApproved: false });
    const pendingProductsCount = await Product.countDocuments({ isApproved: false });

    res.json({
      totalUsers,
      totalSellers,
      totalProducts,
      totalSales,
      totalOrdersCount,
      pendingSellersCount,
      pendingProductsCount,
      monthlySales,
      recentOrders,
      commissionEarnings,
      totalPayouts,
      pendingPayoutsCount,
      pendingPayoutsAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users on the platform
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!['customer', 'seller', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending seller applications
// @route   GET /api/admin/sellers/pending
// @access  Private/Admin
export const getPendingSellers = async (req, res) => {
  try {
    const pendingSellers = await SellerProfile.find({ isApproved: false }).populate('user', 'name email');
    res.json(pendingSellers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject seller profile
// @route   PUT /api/admin/sellers/:id/approve
// @access  Private/Admin
export const approveSeller = async (req, res) => {
  const { approve } = req.body; // boolean: true = approve, false = reject (delete profile/demote)

  try {
    const sellerProfile = await SellerProfile.findById(req.params.id);

    if (!sellerProfile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    if (approve) {
      sellerProfile.isApproved = true;
      await sellerProfile.save();
      
      // Update User verification status
      await User.findByIdAndUpdate(sellerProfile.user, { isVerified: true });

      res.json({ message: 'Seller approved successfully', sellerProfile });
    } else {
      // Revert user role back to customer if rejected
      await User.findByIdAndUpdate(sellerProfile.user, { role: 'customer' });
      await SellerProfile.findByIdAndDelete(req.params.id);
      
      res.json({ message: 'Seller application rejected and profile removed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending products waiting for approval
// @route   GET /api/admin/products/pending
// @access  Private/Admin
export const getPendingProducts = async (req, res) => {
  try {
    const pendingProducts = await Product.find({ isApproved: false })
      .populate('seller', 'name')
      .populate('category', 'name');
    res.json(pendingProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or reject a product listing
// @route   PUT /api/admin/products/:id/approve
// @access  Private/Admin
export const approveProduct = async (req, res) => {
  const { approve } = req.body; // boolean

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (approve) {
      product.isApproved = true;
      product.status = product.stock > 0 ? 'Active' : 'Approved';
      await product.save();
      res.json({ message: 'Product approved successfully', product });
    } else {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: 'Product submission rejected and deleted' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders on the platform
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status globally
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
export const updateAdminOrderStatus = async (req, res) => {
  const { paymentStatus, orderStatus } = req.body;

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    if (orderStatus) {
      for (const item of order.items) {
        const oldStatus = item.orderStatus;
        if (oldStatus === orderStatus) continue;

        item.orderStatus = orderStatus;

        // Shift or revert funds on delivery/cancellation/refund
        const sellerProfile = await SellerProfile.findOne({ user: item.seller });
        const commissionRate = sellerProfile ? sellerProfile.commissionRate : 10;
        const itemRevenue = item.price * item.quantity;
        const netRevenue = itemRevenue * (1 - commissionRate / 100);

        if (oldStatus !== 'delivered' && orderStatus === 'delivered') {
          // Shift from pending to available balance
          await SellerBalance.findOneAndUpdate(
            { seller: item.seller },
            { $inc: { pendingBalance: -netRevenue, availableBalance: netRevenue } },
            { upsert: true }
          );
        } else if (orderStatus === 'cancelled' || orderStatus === 'refunded') {
          // Revert funds
          if (oldStatus === 'delivered' || oldStatus === 'returned') {
            await SellerBalance.findOneAndUpdate(
              { seller: item.seller },
              { $inc: { availableBalance: -netRevenue } },
              { upsert: true }
            );
          } else {
            await SellerBalance.findOneAndUpdate(
              { seller: item.seller },
              { $inc: { pendingBalance: -netRevenue } },
              { upsert: true }
            );
          }

          if (sellerProfile) {
            sellerProfile.earnings = Math.max(0, sellerProfile.earnings - netRevenue);
            await sellerProfile.save();
          }
        }
      }
    }

    await order.save();
    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all payout requests
// @route   GET /api/admin/payouts
// @access  Private/Admin
export const getAllPayoutRequests = async (req, res) => {
  try {
    const requests = await PayoutRequest.find({})
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve seller payout withdrawal request
// @route   PUT /api/admin/payouts/:id/approve
// @access  Private/Admin
export const approvePayoutRequest = async (req, res) => {
  try {
    const { referenceId } = req.body;
    const request = await PayoutRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Payout request already ${request.status}` });
    }

    // Set request status to approved
    request.status = 'approved';
    await request.save();

    // Increment withdrawnBalance in SellerBalance
    await SellerBalance.findOneAndUpdate(
      { seller: request.seller },
      { $inc: { withdrawnBalance: request.amount } },
      { upsert: true }
    );

    // Create success payout transaction
    await PayoutTransaction.create({
      seller: request.seller,
      payoutRequest: request._id,
      amount: request.amount,
      type: 'payout',
      status: 'success',
      referenceId: referenceId || 'TXN-' + Date.now(),
    });

    res.json({ message: 'Payout request approved successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject seller payout withdrawal request
// @route   PUT /api/admin/payouts/:id/reject
// @access  Private/Admin
export const rejectPayoutRequest = async (req, res) => {
  try {
    const request = await PayoutRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Payout request already ${request.status}` });
    }

    // Set request status to rejected
    request.status = 'rejected';
    await request.save();

    // Revert the amount back to availableBalance
    await SellerBalance.findOneAndUpdate(
      { seller: request.seller },
      { $inc: { availableBalance: request.amount } },
      { upsert: true }
    );

    // Create failed transaction log
    await PayoutTransaction.create({
      seller: request.seller,
      payoutRequest: request._id,
      amount: request.amount,
      type: 'payout',
      status: 'failed',
      referenceId: 'REJECTED-' + Date.now(),
    });

    res.json({ message: 'Payout request rejected successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all sellers
// @route   GET /api/admin/sellers
// @access  Private/Admin
export const getSellers = async (req, res) => {
  try {
    const sellers = await SellerProfile.find({}).populate('user', 'name email');
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suspend or unsuspend a seller
// @route   PUT /api/admin/sellers/:id/suspend
// @access  Private/Admin
export const suspendSeller = async (req, res) => {
  try {
    const sellerProfile = await SellerProfile.findById(req.params.id);
    if (!sellerProfile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    sellerProfile.isSuspended = !sellerProfile.isSuspended;
    await sellerProfile.save();

    res.json({
      message: `Seller account ${sellerProfile.isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      sellerProfile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update custom commission rate for seller
// @route   PUT /api/admin/sellers/:id/commission
// @access  Private/Admin
export const updateSellerCommission = async (req, res) => {
  try {
    const { commissionRate } = req.body;
    const rate = Number(commissionRate);

    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ message: 'Please specify a valid commission percentage between 0 and 100' });
    }

    const sellerProfile = await SellerProfile.findById(req.params.id);
    if (!sellerProfile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    sellerProfile.commissionRate = rate;
    await sellerProfile.save();

    res.json({ message: 'Commission rate updated successfully', sellerProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
