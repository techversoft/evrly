import Order from '../models/Order.js';
import Product from '../models/Product.js';
import SellerProfile from '../models/SellerProfile.js';
import SellerBalance from '../models/SellerBalance.js';
import PayoutRequest from '../models/PayoutRequest.js';

// @desc    Get seller dashboard statistics
// @route   GET /api/seller/dashboard
// @access  Private/Seller
export const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // 1. Fetch Seller Profile for shop info and total earnings
    const profile = await SellerProfile.findOne({ user: sellerId });
    if (!profile) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    // 2. Fetch all orders containing products from this seller
    const orders = await Order.find({ 'items.seller': sellerId, paymentStatus: 'paid' });

    // 3. Calculate statistics
    let totalItemsSold = 0;
    let pendingFulfillmentCount = 0;
    let salesByMonth = Array(12).fill(0); // For simple monthly charting

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthIndex = orderDate.getMonth();

      order.items.forEach(item => {
        if (item.seller.toString() === sellerId.toString()) {
          totalItemsSold += item.quantity;
          
          if (['pending', 'processing', 'shipped'].includes(item.orderStatus)) {
            pendingFulfillmentCount++;
          }

          // Accumulate item revenue
          salesByMonth[monthIndex] += item.price * item.quantity;
        }
      });
    });

    // 4. Inventory stats
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const lowStockProducts = await Product.countDocuments({ seller: sellerId, stock: { $lt: 5 } });

    res.json({
      shopName: profile.shopName,
      shopDescription: profile.shopDescription,
      earnings: profile.earnings,
      isApproved: profile.isApproved,
      totalItemsSold,
      pendingFulfillmentCount,
      totalProducts,
      lowStockProducts,
      salesByMonth,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders containing products belonging to this seller
// @route   GET /api/seller/orders
// @access  Private/Seller
export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Retrieve orders that have at least one item from this seller
    const orders = await Order.find({ 'items.seller': sellerId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Map each order to only highlight items relevant to this seller
    const sellerOrders = orders.map(order => {
      const relevantItems = order.items.filter(item => item.seller.toString() === sellerId.toString());
      return {
        _id: order._id,
        user: order.user,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        items: relevantItems,
      };
    });

    res.json(sellerOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update delivery/shipping status of a specific order item
// @route   PUT /api/seller/orders/:orderId/item/:productId
// @access  Private/Seller
export const updateOrderItemStatus = async (req, res) => {
  const { status } = req.body; // pending_payment, paid, confirmed, processing, packed, shipped, delivered, cancelled, returned, refunded
  const { orderId, productId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the item matching the product ID and seller ID
    const item = order.items.find(
      (i) => i.product.toString() === productId.toString() && i.seller.toString() === req.user._id.toString()
    );

    if (!item) {
      return res.status(404).json({ message: 'Product not found in this order for this seller' });
    }

    const oldStatus = item.orderStatus;
    item.orderStatus = status;

    // Shift or revert funds on delivery/cancellation/refund
    const sellerProfile = await SellerProfile.findOne({ user: req.user._id });
    const commissionRate = sellerProfile ? sellerProfile.commissionRate : 10;
    const itemRevenue = item.price * item.quantity;
    const netRevenue = itemRevenue * (1 - commissionRate / 100);

    if (oldStatus !== 'delivered' && status === 'delivered') {
      // Shift from pending to available balance
      await SellerBalance.findOneAndUpdate(
        { seller: req.user._id },
        { $inc: { pendingBalance: -netRevenue, availableBalance: netRevenue } },
        { upsert: true }
      );
    } else if (status === 'cancelled' || status === 'refunded') {
      // Revert funds
      if (oldStatus === 'delivered' || oldStatus === 'returned') {
        // If it was already delivered, decrement availableBalance
        await SellerBalance.findOneAndUpdate(
          { seller: req.user._id },
          { $inc: { availableBalance: -netRevenue } },
          { upsert: true }
        );
      } else {
        // Otherwise decrement pendingBalance
        await SellerBalance.findOneAndUpdate(
          { seller: req.user._id },
          { $inc: { pendingBalance: -netRevenue } },
          { upsert: true }
        );
      }

      // Revert earnings in seller profile
      if (sellerProfile) {
        sellerProfile.earnings = Math.max(0, sellerProfile.earnings - netRevenue);
        await sellerProfile.save();
      }
    }

    await order.save();

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products listed by this seller
// @route   GET /api/seller/products
// @access  Private/Seller
export const getSellerProducts = async (req, res) => {
  try {
    const profile = await SellerProfile.findOne({ user: req.user._id });
    const isApproved = profile ? profile.isApproved : false;
    const products = await Product.find({ seller: req.user._id }).populate('category', 'name');
    res.json({ products, isApproved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller payouts & balance details
// @route   GET /api/seller/payouts
// @access  Private/Seller
export const getSellerPayouts = async (req, res) => {
  try {
    const sellerId = req.user._id;

    let balance = await SellerBalance.findOne({ seller: sellerId });
    if (!balance) {
      balance = await SellerBalance.create({
        seller: sellerId,
        availableBalance: 0,
        pendingBalance: 0,
        withdrawnBalance: 0,
      });
    }

    const requests = await PayoutRequest.find({ seller: sellerId }).sort({ createdAt: -1 });

    res.json({ balance, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit a new payout withdrawal request
// @route   POST /api/seller/payouts/request
// @access  Private/Seller
export const createPayoutRequest = async (req, res) => {
  const { amount, bankDetails } = req.body;

  try {
    const sellerId = req.user._id;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Please specify a valid amount greater than 0' });
    }

    if (!bankDetails || !bankDetails.accountNo || !bankDetails.ifscCode || !bankDetails.bankName || !bankDetails.holderName) {
      return res.status(400).json({ message: 'Please provide complete bank details' });
    }

    const balance = await SellerBalance.findOne({ seller: sellerId });
    if (!balance || balance.availableBalance < parsedAmount) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }

    // Deduct the requested amount from availableBalance immediately to prevent double requests
    balance.availableBalance -= parsedAmount;
    await balance.save();

    // Create payout request
    const payoutRequest = await PayoutRequest.create({
      seller: sellerId,
      amount: parsedAmount,
      status: 'pending',
      bankDetails,
    });

    res.status(201).json({ message: 'Payout request submitted successfully', payoutRequest, balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
