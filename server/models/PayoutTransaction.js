import mongoose from 'mongoose';

const payoutTransactionSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    payoutRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutRequest',
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['payout', 'credit', 'debit'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'success',
      index: true,
    },
    referenceId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const PayoutTransaction = mongoose.model('PayoutTransaction', payoutTransactionSchema);

export default PayoutTransaction;
