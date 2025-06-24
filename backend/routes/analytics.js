// routes/analytics.js (Enhanced)
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Frontend-expected endpoints (matching what your React app calls)

// @route   GET /api/analytics/summary
// @desc    Get dashboard summary analytics (alias for dashboard)
// @access  Private
router.get('/summary', analyticsController.getDashboardAnalytics);

// @route   GET /api/analytics/trends
// @desc    Get trends analytics with time-series data
// @access  Private
router.get('/trends', analyticsController.getTrendsAnalytics);

// Original endpoints
// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// @route   GET /api/analytics/churn-predictions
// @desc    Get churn predictions
// @access  Private
router.get('/churn-predictions', analyticsController.getChurnPredictions);

// @route   GET /api/analytics/swap-forecast
// @desc    Get swap demand forecast
// @access  Private
router.get('/swap-forecast', analyticsController.getSwapForecast);

// @route   GET /api/analytics/rider-clustering
// @desc    Get rider clustering analysis
// @access  Private
router.get('/rider-clustering', analyticsController.getRiderClustering);

// @route   GET /api/analytics/location-analytics
// @desc    Get location-based analytics
// @access  Private
router.get('/location-analytics', analyticsController.getLocationAnalytics);

// @route   GET /api/analytics/rider-behavior
// @desc    Get rider behavior analytics
// @access  Private
router.get('/rider-behavior', analyticsController.getRiderBehaviorAnalytics);

// @route   GET /api/analytics/marketing-optimization
// @desc    Get marketing optimization recommendations
// @access  Private
router.get('/marketing-optimization', analyticsController.getMarketingOptimization);

// @route   GET /api/analytics/comprehensive-report
// @desc    Generate comprehensive analytics report
// @access  Private
router.get('/comprehensive-report', analyticsController.generateComprehensiveReport);

module.exports = router;