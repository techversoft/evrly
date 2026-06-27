import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import SellerProfile from '../models/SellerProfile.js';
import SellerBalance from '../models/SellerBalance.js';
import SellerAnalytics from '../models/SellerAnalytics.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay.js';

// @desc    Create a new order & initiate payment
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  try {
    // 1. Get user cart
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name price images seller stock customizationFields'
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // 2. Map cart items to order items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.product;
      
      // Stock validation
      if (product.stock < cartItem.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
      }

      const itemTotal = product.price * cartItem.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        seller: product.seller,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        images: product.images,
        customizationValues: cartItem.customizationValues,
        orderStatus: 'pending_payment',
      });
    }

    const shippingPrice = totalAmount > 500 ? 0 : 50; // Free shipping above 500 INR
    totalAmount += shippingPrice;

    // 3. Create the database Order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'razorpay',
      paymentStatus: 'pending',
      totalAmount,
      shippingPrice,
    });

    const createdOrder = await order.save();

    // 4. Handle Payment Gateway initiation if Razorpay is chosen
    if (order.paymentMethod === 'razorpay') {
      try {
        const razorpayOrder = await createRazorpayOrder(totalAmount, createdOrder._id.toString());
        
        createdOrder.paymentDetails = {
          razorpayOrderId: razorpayOrder.id,
        };
        await createdOrder.save();

        return res.status(201).json({
          order: createdOrder,
          razorpayOrder, // Frontend uses this to trigger checkout modal
          razorpayKey: process.env.RAZORPAY_KEY_ID,
          customer: {
            name: req.user.name || '',
            email: req.user.email || '',
            phoneNumber: req.user.phoneNumber || '',
          },
        });
      } catch (payError) {
        console.error('Razorpay Order Creation Failed, order kept as pending:', payError);
        return res.status(201).json({
          order: createdOrder,
          paymentInitiationError: 'Could not initialize online payment. Please retry payment.',
        });
      }
    }

    // For COD
    if (order.paymentMethod === 'cod') {
      for (const item of createdOrder.items) {
        item.orderStatus = 'processing';
        
        // 1. Decrement stock
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });

        // 2. Net revenue after custom marketplace commission
        const sellerProfile = await SellerProfile.findOne({ user: item.seller });
        const commissionRate = sellerProfile ? sellerProfile.commissionRate : 10;
        const itemRevenue = item.price * item.quantity;
        const netRevenue = itemRevenue * (1 - commissionRate / 100);

        // 3. Update SellerProfile earnings
        if (sellerProfile) {
          sellerProfile.earnings += netRevenue;
          await sellerProfile.save();
        }

        // 4. Update SellerBalance pendingBalance
        await SellerBalance.findOneAndUpdate(
          { seller: item.seller },
          { $inc: { pendingBalance: netRevenue } },
          { upsert: true, new: true }
        );

        // 5. Update SellerAnalytics
        await SellerAnalytics.findOneAndUpdate(
          { seller: item.seller },
          { $inc: { totalOrders: 1, totalRevenue: netRevenue } },
          { upsert: true, new: true }
        );
      }
      await createdOrder.save();

      // Clear the user's cart
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    }

    res.status(201).json({ order: createdOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/orders/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (isValid) {
      // Update order status
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      };

      // Set items status to processing and adjust product stock/seller earnings
      for (const item of order.items) {
        item.orderStatus = 'processing';
        
        // 1. Decrement product stock
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });

        // 2. Calculate net revenue (custom platform commission)
        const sellerProfile = await SellerProfile.findOne({ user: item.seller });
        const commissionRate = sellerProfile ? sellerProfile.commissionRate : 10;
        const itemRevenue = item.price * item.quantity;
        const netRevenue = itemRevenue * (1 - commissionRate / 100);

        // 3. Update SellerProfile earnings
        if (sellerProfile) {
          sellerProfile.earnings += netRevenue;
          await sellerProfile.save();
        }

        // 4. Update SellerBalance pendingBalance
        await SellerBalance.findOneAndUpdate(
          { seller: item.seller },
          { $inc: { pendingBalance: netRevenue } },
          { upsert: true, new: true }
        );

        // 5. Update SellerAnalytics
        await SellerAnalytics.findOneAndUpdate(
          { seller: item.seller },
          { $inc: { totalOrders: 1, totalRevenue: netRevenue } },
          { upsert: true, new: true }
        );
      }

      await order.save();

      // Clear the user's cart
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

      res.json({ message: 'Payment verified and order processed successfully', order });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization: User who ordered, Admin, or Seller who has an item in the order
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isSeller = order.items.some(item => item.seller.toString() === req.user._id.toString());

    if (isOwner || isAdmin || isSeller) {
      res.json(order);
    } else {
      res.status(403).json({ message: 'Not authorized to view this order' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order item
// @route   POST /api/orders/:orderId/cancel/:productId
// @access  Private
export const cancelOrderItem = async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel items in this order' });
    }

    const item = order.items.find(i => i.product.toString() === productId.toString());
    if (!item) {
      return res.status(404).json({ message: 'Item not found in order' });
    }

    if (['shipped', 'delivered', 'cancelled', 'returned', 'refunded'].includes(item.orderStatus)) {
      return res.status(400).json({ message: `Cannot cancel item with status: ${item.orderStatus}` });
    }

    const oldStatus = item.orderStatus;
    item.orderStatus = 'cancelled';

    // Increment product stock
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });

    // If order was already paid, adjust seller earnings and pending balance
    if (order.paymentStatus === 'paid' && oldStatus !== 'pending_payment') {
      const sellerProfile = await SellerProfile.findOne({ user: item.seller });
      const commissionRate = sellerProfile ? sellerProfile.commissionRate : 10;
      const itemRevenue = item.price * item.quantity;
      const netRevenue = itemRevenue * (1 - commissionRate / 100);

      if (sellerProfile) {
        sellerProfile.earnings = Math.max(0, sellerProfile.earnings - netRevenue);
        await sellerProfile.save();
      }

      await SellerBalance.findOneAndUpdate(
        { seller: item.seller },
        { $inc: { pendingBalance: -netRevenue } },
        { upsert: true }
      );
    }

    await order.save();
    res.json({ message: 'Item cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request return for order item
// @route   POST /api/orders/:orderId/return/:productId
// @access  Private
export const returnOrderItem = async (req, res) => {
  const { orderId, productId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const item = order.items.find(i => i.product.toString() === productId.toString());
    if (!item) {
      return res.status(404).json({ message: 'Item not found in order' });
    }

    if (item.orderStatus !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered items can be returned' });
    }

    // Verify within return window (e.g. 7 days)
    const deliveredAt = order.updatedAt; // Or order delivery date, fallback to updatedAt
    const diffTime = Math.abs(new Date() - new Date(deliveredAt));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
      return res.status(400).json({ message: 'Return window of 7 days has expired' });
    }

    item.orderStatus = 'returned';
    await order.save();

    res.json({ message: 'Return requested successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
