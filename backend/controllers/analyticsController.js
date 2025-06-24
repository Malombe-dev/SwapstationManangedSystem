// controllers/analyticsController.js (Fixed Version)
const Rider = require('../models/Rider');
const SwapHistory = require('../models/SwapHistory');
const Payment = require('../models/Payment');
const Marketing = require('../models/Marketing');
const axios = require('axios');

// Helper function to safely call ML service
const callMLService = async (url, options = {}) => {
  try {
    if (!process.env.ML_SERVICE_URL) {
      console.warn('ML_SERVICE_URL not configured, returning mock data');
      return { data: { predictions: [], recommendations: [] } };
    }
    
    const response = await axios({
      url: `${process.env.ML_SERVICE_URL}${url}`,
      timeout: 5000, // 5 second timeout
      ...options
    });
    return response;
  } catch (error) {
    console.error(`ML Service error for ${url}:`, error.message);
    return { data: { predictions: [], recommendations: [] } };
  }
};

// Dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.getTime());
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Use Promise.allSettled to handle potential database errors gracefully
    const results = await Promise.allSettled([
      // Basic counts
      Rider.countDocuments().catch(() => 0),
      Rider.countDocuments({ status: 'active' }).catch(() => 0),
      SwapHistory.countDocuments({
        swapDate: { $gte: new Date().setHours(0, 0, 0, 0) }
      }).catch(() => 0),

      // Revenue analytics
      Payment.aggregate([
        { $match: { paymentDate: { $gte: startOfMonth }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).catch(() => []),

      // Churn analysis
      Rider.aggregate([
        {
          $group: {
            _id: '$churnRisk',
            count: { $sum: 1 }
          }
        }
      ]).catch(() => []),

      // Growth trends
      Rider.aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$registrationDate' }
            },
            newRiders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).catch(() => []),

      // Top performing locations
      SwapHistory.aggregate([
        {
          $group: {
            _id: '$location.name',
            swapCount: { $sum: 1 },
            revenue: { $sum: '$cost' }
          }
        },
        { $sort: { swapCount: -1 } },
        { $limit: 10 }
      ]).catch(() => []),

      // Recent activity
      SwapHistory.find()
        .populate('riderId', 'firstName lastName')
        .sort({ swapDate: -1 })
        .limit(10)
        .catch(() => []),

      // Payment trends
      Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: startOfWeek },
            status: 'completed'
          }
        },
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
      ]).catch(() => [])
    ]);

    // Extract results, using default values for failed promises
    const [
      totalRiders,
      activeRiders,
      totalSwapsToday,
      monthlyRevenue,
      churnAnalysis,
      riderGrowth,
      topLocations,
      recentActivity,
      paymentTrends
    ] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Query ${index} failed:`, result.reason?.message);
        return index < 3 ? 0 : []; // Return 0 for counts, [] for arrays
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRiders: totalRiders || 0,
          activeRiders: activeRiders || 0,
          totalSwapsToday: totalSwapsToday || 0,
          monthlyRevenue: (Array.isArray(monthlyRevenue) && monthlyRevenue[0]) ? monthlyRevenue[0].total : 0
        },
        churnAnalysis: churnAnalysis || [],
        riderGrowth: riderGrowth || [],
        topLocations: topLocations || [],
        recentActivity: recentActivity || [],
        paymentTrends: paymentTrends || []
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get trends analytics - Fixed method
exports.getTrendsAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Use Promise.allSettled for better error handling
    const results = await Promise.allSettled([
      // Daily swap trends
      SwapHistory.aggregate([
        {
          $match: {
            swapDate: { $gte: daysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$swapDate' }
            },
            swaps: { $sum: 1 },
            revenue: { $sum: '$cost' },
            avgBatteryUsage: { $avg: { $subtract: ['$batteryLevelBefore', '$batteryLevelAfter'] } }
          }
        },
        { $sort: { _id: 1 } }
      ]).catch(() => []),

      // Rider registration trends
      Rider.aggregate([
        {
          $match: {
            registrationDate: { $gte: daysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$registrationDate' }
            },
            newRiders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).catch(() => []),

      // Payment trends
      Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: daysAgo },
            status: 'completed'
          }
        },
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
      ]).catch(() => []),

      // Hourly usage patterns
      SwapHistory.aggregate([
        {
          $match: {
            swapDate: { $gte: daysAgo }
          }
        },
        {
          $group: {
            _id: { $hour: '$swapDate' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).catch(() => [])
    ]);

    const [swapTrends, riderTrends, paymentTrends, hourlyPatterns] = results.map(result => 
      result.status === 'fulfilled' ? result.value : []
    );

    res.json({
      success: true,
      data: {
        swapTrends,
        riderTrends,
        paymentTrends,
        hourlyPatterns,
        period: {
          days: parseInt(days),
          startDate: daysAgo,
          endDate: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get churn predictions - Fixed with better error handling
exports.getChurnPredictions = async (req, res) => {
  try {
    // Call ML service for churn predictions with error handling
    const mlResponse = await callMLService('/predict/churn');
    
    // Update riders with churn predictions if available
    if (mlResponse.data.predictions && Array.isArray(mlResponse.data.predictions)) {
      try {
        for (const prediction of mlResponse.data.predictions) {
          if (prediction.riderId && prediction.risk) {
            await Rider.findOneAndUpdate(
              { riderId: prediction.riderId },
              { churnRisk: prediction.risk }
            ).catch(err => console.error('Failed to update rider churn risk:', err));
          }
        }
      } catch (updateError) {
        console.error('Error updating rider churn predictions:', updateError);
      }
    }

    // Get updated churn statistics with rider details
    const churnStats = await Rider.aggregate([
      {
        $group: {
          _id: '$churnRisk',
          count: { $sum: 1 },
          riders: { 
            $push: { 
              riderId: '$riderId', 
              firstName: '$firstName', 
              lastName: '$lastName',
              phoneNumber: '$phoneNumber',
              registrationDate: '$registrationDate'
            } 
          }
        }
      }
    ]).catch(() => []);

    res.json({
      success: true,
      data: churnStats,
      mlPredictions: mlResponse.data.predictions || []
    });
  } catch (error) {
    console.error('Churn predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch churn predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get swap demand forecast - Fixed
exports.getSwapForecast = async (req, res) => {
  try {
    const { location, days = 7 } = req.query;
    
    const mlResponse = await callMLService('/forecast/swaps', {
      method: 'POST',
      data: {
        location,
        days: parseInt(days)
      }
    });

    res.json({
      success: true,
      data: mlResponse.data
    });
  } catch (error) {
    console.error('Swap forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch swap forecast',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get rider clustering analysis - Fixed
exports.getRiderClustering = async (req, res) => {
  try {
    const mlResponse = await callMLService('/analytics/rider-clustering');

    res.json({
      success: true,
      data: mlResponse.data
    });
  } catch (error) {
    console.error('Rider clustering error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rider clustering analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get location analytics - Fixed
exports.getLocationAnalytics = async (req, res) => {
  try {
    const results = await Promise.allSettled([
      SwapHistory.aggregate([
        {
          $group: {
            _id: '$location.name',
            totalSwaps: { $sum: 1 },
            avgBatteryLevel: { $avg: '$batteryLevelBefore' },
            peakHours: {
              $push: {
                $hour: '$swapDate'
              }
            }
          }
        },
        {
          $addFields: {
            utilizationRate: {
              $multiply: [
                { $divide: ['$totalSwaps', 100] }, // Assuming 100 max daily capacity
                100
              ]
            }
          }
        },
        { $sort: { totalSwaps: -1 } }
      ]),

      SwapHistory.aggregate([
        {
          $group: {
            _id: { $hour: '$swapDate' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const [locationStats, hourlyDistribution] = results.map(result => 
      result.status === 'fulfilled' ? result.value : []
    );

    res.json({
      success: true,
      data: {
        locationStats,
        hourlyDistribution
      }
    });
  } catch (error) {
    console.error('Location analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get rider behavior analytics - Fixed
exports.getRiderBehaviorAnalytics = async (req, res) => {
  try {
    const results = await Promise.allSettled([
      // Usage patterns
      SwapHistory.aggregate([
        {
          $group: {
            _id: '$riderId',
            totalSwaps: { $sum: 1 },
            avgBatteryUsage: { $avg: { $subtract: ['$batteryLevelBefore', '$batteryLevelAfter'] } },
            favoriteLocation: { $first: '$location.name' },
            lastSwapDate: { $max: '$swapDate' }
          }
        },
        {
          $addFields: {
            daysSinceLastSwap: {
              $divide: [
                { $subtract: [new Date(), '$lastSwapDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      ]),

      // Payment behavior
      Payment.aggregate([
        {
          $group: {
            _id: '$riderId',
            totalPayments: { $sum: 1 },
            avgPaymentAmount: { $avg: '$amount' },
            failedPayments: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            onTimePayments: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        },
        {
          $addFields: {
            paymentReliability: {
              $cond: [
                { $gt: ['$totalPayments', 0] },
                { $divide: ['$onTimePayments', '$totalPayments'] },
                0
              ]
            }
          }
        }
      ])
    ]);

    const [usagePatterns, paymentBehavior] = results.map(result => 
      result.status === 'fulfilled' ? result.value : []
    );

    res.json({
      success: true,
      data: {
        usagePatterns,
        paymentBehavior
      }
    });
  } catch (error) {
    console.error('Rider behavior analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rider behavior analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get marketing optimization recommendations - Fixed
exports.getMarketingOptimization = async (req, res) => {
  try {
    const { campaignType = 'retention' } = req.query;
    
    const mlResponse = await callMLService('/analytics/marketing-optimization', {
      method: 'POST',
      data: {
        campaign_type: campaignType
      }
    });

    res.json({
      success: true,
      data: mlResponse.data
    });
  } catch (error) {
    console.error('Marketing optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketing optimization',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Generate comprehensive report - Fixed
exports.generateComprehensiveReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Use Promise.allSettled for better error handling
    const results = await Promise.allSettled([
      // Rider statistics
      Rider.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalRiders: { $sum: 1 },
            activeRiders: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Swap statistics
      SwapHistory.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalSwaps: { $sum: 1 },
            avgBatteryUsage: { $avg: { $subtract: ['$batteryLevelBefore', '$batteryLevelAfter'] } }
          }
        }
      ]),
      
      // Payment statistics
      Payment.aggregate([
        { $match: { ...dateFilter, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            avgPaymentAmount: { $avg: '$amount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]),
      
      // Marketing statistics (if Marketing model exists)
      Marketing ? Marketing.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalCampaigns: { $sum: 1 },
            totalCost: { $sum: '$cost' }
          }
        }
      ]).catch(() => []) : Promise.resolve([]),
      
      // Get churn predictions
      callMLService('/predict/churn')
    ]);

    const [riderStats, swapStats, paymentStats, marketingStats, churnPredictions] = results.map(result => 
      result.status === 'fulfilled' ? result.value : (result.reason ? [] : { data: { predictions: [] } })
    );

    const report = {
      reportDate: new Date(),
      dateRange: { startDate, endDate },
      summary: {
        riders: Array.isArray(riderStats) && riderStats[0] ? riderStats[0] : { totalRiders: 0, activeRiders: 0 },
        swaps: Array.isArray(swapStats) && swapStats[0] ? swapStats[0] : { totalSwaps: 0, avgBatteryUsage: 0 },
        payments: Array.isArray(paymentStats) && paymentStats[0] ? paymentStats[0] : { totalRevenue: 0, avgPaymentAmount: 0, totalTransactions: 0 },
        marketing: Array.isArray(marketingStats) && marketingStats[0] ? marketingStats[0] : { totalCampaigns: 0, totalCost: 0 },
        churnRisk: {
          totalAtRisk: churnPredictions.data && churnPredictions.data.predictions ? 
            churnPredictions.data.predictions.filter(p => p.risk === 'high').length : 0,
          predictions: churnPredictions.data && churnPredictions.data.predictions ? 
            churnPredictions.data.predictions.slice(0, 10) : []
        }
      }
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Comprehensive report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comprehensive report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Add a simple summary endpoint for basic analytics
exports.getSummaryAnalytics = async (req, res) => {
  try {
    const results = await Promise.allSettled([
      Rider.countDocuments().catch(() => 0),
      Rider.countDocuments({ status: 'active' }).catch(() => 0),
      SwapHistory.countDocuments({
        swapDate: { $gte: new Date().setHours(0, 0, 0, 0) }
      }).catch(() => 0),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).catch(() => [])
    ]);

    const [totalRiders, activeRiders, todaySwaps, revenue] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Summary query ${index} failed:`, result.reason?.message);
        return index < 3 ? 0 : [];
      }
    });

    res.json({
      success: true,
      data: {
        totalRiders: totalRiders || 0,
        activeRiders: activeRiders || 0,
        todaySwaps: todaySwaps || 0,
        totalRevenue: (Array.isArray(revenue) && revenue[0]) ? revenue[0].total : 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Summary analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};