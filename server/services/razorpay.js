import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Creates a Razorpay order.
 * Falls back to mock order if Razorpay is not configured.
 * @param {Number} amount Amount in INR (not paise, we multiply by 100 here)
 * @param {String} receipt Unique receipt ID (usually order ID)
 * @returns {Promise<Object>} Razorpay Order Object
 */
export const createRazorpayOrder = async (amount, receipt) => {
  const amountInPaise = Math.round(amount * 100);

  if (!razorpayInstance) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Razorpay credentials are not configured in production mode.');
    }
    console.warn('Razorpay credentials not set. Creating mock payment order.');
    return {
      id: `mock_order_${Math.random().toString(36).substring(2, 11)}`,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      status: 'created',
      attempts: 0,
      notes: [],
      created_at: Math.floor(Date.now() / 1000),
      isMock: true
    };
  }

  try {
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
    };
    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw error;
  }
};

/**
 * Verifies Razorpay Payment Signature
 * Falls back to true for mock orders if Razorpay is not configured (non-production only).
 * @param {String} orderId 
 * @param {String} paymentId 
 * @param {String} signature 
 * @returns {Boolean}
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (process.env.NODE_ENV === 'production') {
    if (!razorpayInstance) {
      return false;
    }
    if (orderId.startsWith('mock_order_')) {
      return false; // Block mock payments in production
    }
  } else {
    if (!razorpayInstance || orderId.startsWith('mock_order_')) {
      console.warn('Verifying mock payment signature (Passed).');
      return true; // Auto-pass for mock testing in development
    }
  }

  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
};
