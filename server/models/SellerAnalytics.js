import mongoose from 'mongoose';

const sellerAnalyticsSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    topProducts: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        salesCount: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
      }
    ],
    monthlyPerformance: [
      {
        month: { type: String }, // e.g. "2026-06"
        orders: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
      }
    ],
  },
  {
    timestamps: true,
  }
);

const SellerAnalytics = mongoose.model('SellerAnalytics', sellerAnalyticsSchema);

export default SellerAnalytics;
