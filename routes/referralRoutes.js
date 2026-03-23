const express = require('express');
const {
  generateReferralCode,
  trackReferral,
  getReferralStats,
  redeemPoints,
  getReferralHistory,
} = require('../controllers/referralController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected routes (require authentication)
router.post('/generate-code', protect, generateReferralCode);
router.post('/track', protect, trackReferral);
router.get('/stats', protect, getReferralStats);
router.post('/redeem', protect, redeemPoints);
router.get('/history', protect, getReferralHistory);

module.exports = router;
