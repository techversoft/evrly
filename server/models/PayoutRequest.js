import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    bankDetails: {
      accountNo: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
      holderName: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema);

export default PayoutRequest;
