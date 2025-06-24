const Rider = require('../models/Rider');
const SwapHistory = require('../models/SwapHistory');
const Payment = require('../models/Payment');

// Get all riders
exports.getAllRiders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const riders = await Rider.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Rider.countDocuments();

    res.json({
      success: true,
      data: riders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new rider
exports.createRider = async (req, res) => {
  try {
    const rider = new Rider(req.body);
    await rider.save();

    res.status(201).json({
      success: true,
      data: rider
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get rider by ID
exports.getRiderById = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found'
      });
    }

    // Get rider's swap history
    const swapHistory = await SwapHistory.find({ riderId: rider.riderId })
      .sort({ swapDate: -1 })
      .limit(10);

    // Get rider's payment history
    const paymentHistory = await Payment.find({ riderId: rider.riderId })
      .sort({ paymentDate: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        rider,
        swapHistory,
        paymentHistory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update rider
exports.updateRider = async (req, res) => {
  try {
    const rider = await Rider.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found'
      });
    }

    res.json({
      success: true,
      data: rider
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete rider
exports.deleteRider = async (req, res) => {
  try {
    const rider = await Rider.findByIdAndDelete(req.params.id);

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found'
      });
    }

    res.json({
      success: true,
      message: 'Rider deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};