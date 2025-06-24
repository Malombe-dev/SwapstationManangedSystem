// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  riderId: {
    type: String,
    required: true,
    ref: 'Rider'
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'cash', 'bank_transfer', 'credit'],
    default: 'mpesa'
  },
  transactionId: String,
  paymentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  description: String,
  swapId: {
    type: String,
    ref: 'SwapHistory'
  },
  dueDate: Date,
  paymentType: {
    type: String,
    enum: ['swap_fee', 'monthly_subscription', 'penalty', 'deposit'],
    default: 'swap_fee'
  }
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ riderId: 1, paymentDate: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });

module.exports = mongoose.model('Payment', paymentSchema);