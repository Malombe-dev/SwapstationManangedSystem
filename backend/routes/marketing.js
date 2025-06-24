// routes/marketing.js
const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketingController');

// @route   POST /api/marketing/campaigns
// @desc    Create new marketing campaign
// @access  Private
router.post('/campaigns', marketingController.createCampaign);

// @route   GET /api/marketing/campaigns
// @desc    Get all campaigns
// @access  Private
// routes/marketing.js
router.get('/campaigns', marketingController.getAllCampaigns);


// @route   GET /api/marketing/campaigns/:campaignId/performance
// @desc    Get campaign performance
// @access  Private
router.get('/campaigns/:campaignId/performance', marketingController.getCampaignPerformance);

// @route   PUT /api/marketing/campaigns/response
// @desc    Update campaign response
// @access  Private
router.put('/campaigns/response', marketingController.updateCampaignResponse);

// @route   GET /api/marketing/analytics
// @desc    Get marketing analytics
// @access  Private
router.get('/analytics', marketingController.getMarketingAnalytics);

module.exports = router;

// routes/marketing.js

// ============================================================================
