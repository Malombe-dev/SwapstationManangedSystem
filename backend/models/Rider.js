const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // UUID generator

const riderSchema = new mongoose.Schema({
  riderId: {
    type: String,
    default: () => `RID-${uuidv4()}`, // Automatically generate riderId like "RID-xxxx-xxxx"
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  nationalId: {
    type: String,
    required: true
  },
  bikeInfo: {
    make: String,
    model: String,
    plateNumber: String,
    year: Number
  },
  location: {
    region: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  churnRisk: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  lastSwapDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Rider', riderSchema);
