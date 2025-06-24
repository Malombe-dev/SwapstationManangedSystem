// routes/payments.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private
router.post('/', paymentController.createPayment);

// @route   GET /api/payments
// @desc    Get all payments with filters
// @access  Private
router.get('/', paymentController.getPayments);

// @route   PUT /api/payments/:paymentId/status
// @desc    Update payment status
// @access  Private
router.put('/:paymentId/status', paymentController.updatePaymentStatus);

// @route   GET /api/payments/analytics
// @desc    Get payment analytics
// @access  Private
router.get('/analytics', paymentController.getPaymentAnalytics);

// @route   GET /api/payments/rider/:riderId
// @desc    Get rider payment history
// @access  Private
router.get('/rider/:riderId', paymentController.getRiderPaymentHistory);

module.exports = router;