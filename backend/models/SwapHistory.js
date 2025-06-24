const mongoose = require('mongoose');

const swapHistorySchema = new mongoose.Schema({
  riderId: {
    type: String,
    required: true,
    ref: 'Rider'
  },
  swapDate: {
    type: Date,
    default: Date.now
  },
  cabinetId: {
    type: String,
    required: true
  },
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  batteryLevel: {
    old: Number,
    new: Number
  },
  swapDuration: Number, // in minutes
  cost: Number,
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'cash', 'credit'],
    default: 'mpesa'
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'pending'],
    default: 'completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SwapHistory', swapHistorySchema);