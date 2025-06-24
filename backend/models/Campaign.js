
// models/Campaign.js - NEW SCHEMA FOR CAMPAIGNS
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'active', 'inactive', 'high-risk'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed'],
    default: 'draft'
  },
  // Statistics
  totalSent: {
    type: Number,
    default: 0
  },
  totalOpened: {
    type: Number,
    default: 0
  },
  totalClicked: {
    type: Number,
    default: 0
  },
  totalConverted: {
    type: Number,
    default: 0
  },
  openRate: {
    type: Number,
    default: 0
  },
  clickRate: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add a method to calculate rates
campaignSchema.methods.calculateRates = function() {
  if (this.totalSent > 0) {
    this.openRate = Number(((this.totalOpened / this.totalSent) * 100).toFixed(2));
    this.clickRate = Number(((this.totalClicked / this.totalSent) * 100).toFixed(2));
    this.conversionRate = Number(((this.totalConverted / this.totalSent) * 100).toFixed(2));
  }
};

module.exports = mongoose.model('Campaign', campaignSchema);