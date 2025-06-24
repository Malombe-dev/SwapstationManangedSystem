const express = require('express');
const router = express.Router();
const {
  getAllSwaps,
  createSwap,
  getSwapAnalytics
} = require('../controllers/swapController');

router.route('/')
  .get(getAllSwaps)
  .post(createSwap);

router.get('/analytics', getSwapAnalytics);

module.exports = router;