const SwapHistory = require('../models/SwapHistory');
const Rider = require('../models/Rider');

// Get all swaps
exports.getAllSwaps = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const swaps = await SwapHistory.find()
      .sort({ swapDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('riderId', 'firstName lastName email');

    const total = await SwapHistory.countDocuments();

    res.json({
      success: true,
      data: swaps,
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

// Create new swap
exports.createSwap = async (req, res) => {
  try {
    const swap = new SwapHistory(req.body);
    await swap.save();

    // Update rider's last swap date
    await Rider.findOneAndUpdate(
      { riderId: req.body.riderId },
      { lastSwapDate: new Date() }
    );

    res.status(201).json({
      success: true,
      data: swap
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get swap analytics
exports.getSwapAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = {};

    if (startDate && endDate) {
      matchStage.swapDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await SwapHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSwaps: { $sum: 1 },
          totalRevenue: { $sum: '$cost' },
          averageSwapDuration: { $avg: '$swapDuration' },
          completedSwaps: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Daily swap trends
    const dailyTrends = await SwapHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$swapDate' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$cost' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Location-based analytics
    const locationAnalytics = await SwapHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$location.name',
          swapCount: { $sum: 1 },
          totalRevenue: { $sum: '$cost' }
        }
      },
      { $sort: { swapCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: analytics[0] || {},
        dailyTrends,
        locationAnalytics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};