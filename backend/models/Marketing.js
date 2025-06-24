const mongoose = require('mongoose');

const marketingSchema = new mongoose.Schema({
  campaignId: {
    type: String,
    required: true
  },
  campaignName: {
    type: String,
    required: true
  },
  riderId: {
    type: String,
    required: true,
    ref: 'Rider'
  },
  messageType: {
    type: String,
    enum: ['sms', 'email', 'push', 'call'],
    required: true
  },
  message: String,
  sentDate: {
    type: Date,
    default: Date.now
  },
  responseDate: Date,
  response: {
    type: String,
    enum: ['opened', 'clicked', 'converted', 'ignored'],
    default: 'ignored'
  },
  campaignType: {
    type: String,
    enum: ['promotion', 'retention', 'onboarding', 'feedback']
  },
  cost: Number,
  conversionValue: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('Marketing', marketingSchema);