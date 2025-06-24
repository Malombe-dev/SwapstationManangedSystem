// controllers/paymentController.js
const Payment = require('../models/Payment');
const Rider = require('../models/Rider');

// Create new payment
exports.createPayment = async (req, res) => {
  try {
    const {
      riderId,
      amount,
      paymentMethod,
      description,
      swapId,
      paymentType
    } = req.body;

    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment = new Payment({
      paymentId,
      riderId,
      amount,
      paymentMethod,
      description,
      swapId,
      paymentType
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all payments with filters
exports.getPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      riderId, 
      status, 
      paymentMethod,
      startDate,
      endDate 
    } = req.query;

    const filter = {};
    
    if (riderId) filter.riderId = riderId;
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    if (startDate && endDate) {
      filter.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(filter)
      .populate('riderId', 'firstName lastName phoneNumber')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payments,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
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

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, transactionId } = req.body;

    const payment = await Payment.findOneAndUpdate(
      { paymentId },
      { status, transactionId },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get payment analytics
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Revenue by payment method
    const revenueByMethod = await Payment.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily revenue trend
    const dailyRevenue = await Payment.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Payment status distribution
    const statusDistribution = await Payment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Outstanding payments
    const outstandingPayments = await Payment.aggregate([
      { $match: { status: { $in: ['pending', 'failed'] } } },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top paying riders
    const topRiders = await Payment.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: '$riderId',
          totalPaid: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalPaid: -1 } },
      { $limit: 10 }
    ]);

    // Populate rider details for top riders
    await Payment.populate(topRiders, {
      path: '_id',
      select: 'firstName lastName phoneNumber',
      model: 'Rider'
    });

    res.json({
      success: true,
      data: {
        revenueByMethod,
        dailyRevenue,
        statusDistribution,
        outstandingPayments: outstandingPayments[0] || { totalOutstanding: 0, count: 0 },
        topRiders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get rider payment history
exports.getRiderPaymentHistory = async (req, res) => {
  try {
    const { riderId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ riderId })
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({ riderId });

    // Calculate rider payment summary
    const summary = await Payment.aggregate([
      { $match: { riderId } },
      {
        $group: {
          _id: null,
          totalPaid: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          },
          totalOutstanding: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'failed']] }, '$amount', 0] }
          },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        payments,
        summary: summary[0] || { totalPaid: 0, totalOutstanding: 0, totalTransactions: 0 },
        totalPages: Math.ceil(total / limit),
        currentPage: page,
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