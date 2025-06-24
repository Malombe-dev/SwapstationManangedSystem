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

// ============================================================================
// controllers/marketingController.js - UPDATED CONTROLLER
const Campaign = require('../models/Campaign');
const Marketing = require('../models/Marketing'); // Your existing schema
const Rider = require('../models/Rider');

// Create a new campaign
const createCampaign = async (req, res) => {
  try {
    const { name, type, targetAudience, message, discountPercentage, startDate, endDate } = req.body;
    
    console.log('Creating campaign with data:', req.body);
    
    // Validation
    if (!name || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campaign name and message are required' 
      });
    }
    
    if (!['email', 'sms', 'push'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid campaign type' 
      });
    }
    
    // Create campaign
    const campaign = new Campaign({
      name,
      type,
      targetAudience,
      message,
      discountPercentage: discountPercentage || 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'draft'
    });
    
    await campaign.save();
    
    console.log('Campaign created successfully:', campaign);
    
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });
    
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create campaign'
    });
  }
};

// Get all campaigns with stats
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    
    // Calculate overall stats
    const stats = {
      active: campaigns.filter(c => c.status === 'active').length,
      totalReach: campaigns.reduce((sum, c) => sum + c.totalSent, 0),
      averageOpenRate: campaigns.length > 0 
        ? Number((campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length).toFixed(2))
        : 0,
      revenue: campaigns.reduce((sum, c) => sum + c.totalRevenue, 0),
      email: campaigns.filter(c => c.type === 'email').length,
      sms: campaigns.filter(c => c.type === 'sms').length,
      push: campaigns.filter(c => c.type === 'push').length
    };
    
    res.json({
      success: true,
      campaigns,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch campaigns'
    });
  }
};

// Launch a campaign (send messages to riders)
const launchCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Get target riders based on audience
    let riders = [];
    switch (campaign.targetAudience) {
      case 'all':
        riders = await Rider.find();
        break;
      case 'active':
        riders = await Rider.find({ status: 'active' });
        break;
      case 'inactive':
        riders = await Rider.find({ status: 'inactive' });
        break;
      case 'high-risk':
        // You can implement your own logic for high-risk riders
        riders = await Rider.find({ lastRideDate: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
        break;
    }
    
    // Create marketing records for each rider
    const marketingPromises = riders.map(rider => {
      const marketing = new Marketing({
        campaignId: campaign._id.toString(),
        campaignName: campaign.name,
        riderId: rider._id.toString(),
        messageType: campaign.type,
        message: campaign.message,
        campaignType: 'promotion', // You can determine this based on campaign content
        sentDate: new Date()
      });
      return marketing.save();
    });
    
    await Promise.all(marketingPromises);
    
    // Update campaign status and stats
    campaign.status = 'active';
    campaign.totalSent = riders.length;
    await campaign.save();
    
    res.json({
      success: true,
      message: `Campaign launched successfully to ${riders.length} riders`,
      campaign
    });
    
  } catch (error) {
    console.error('Error launching campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to launch campaign'
    });
  }
};

// Delete a campaign
const deleteCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = await Campaign.findByIdAndDelete(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Optionally delete related marketing records
    await Marketing.deleteMany({ campaignId: campaignId });
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete campaign'
    });
  }
};

// Send retention offer to specific rider
const sendRetentionOffer = async (req, res) => {
  try {
    const { riderId } = req.body;
    
    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        error: 'Rider not found'
      });
    }
    
    // Create a marketing record for the retention offer
    const marketing = new Marketing({
      campaignId: 'RETENTION_' + Date.now(),
      campaignName: 'Retention Offer',
      riderId: riderId,
      messageType: 'email', // or determine based on rider preference
      message: 'Special offer just for you! Come back and get 20% off your next ride.',
      campaignType: 'retention',
      sentDate: new Date()
    });
    
    await marketing.save();
    
    res.json({
      success: true,
      message: 'Retention offer sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending retention offer:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send retention offer'
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  launchCampaign,
  deleteCampaign,
  sendRetentionOffer
};