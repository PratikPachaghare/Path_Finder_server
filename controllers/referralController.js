const User = require('../models/User');
const Referral = require('../models/Referral');
const ReferralFeedback = require('../models/ReferralFeedback');
const crypto = require('crypto');

// Generate unique referral code for user
exports.generateReferralCode = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user already has a referral code, return it
    if (user.referralCode) {
      return res.status(200).json({
        success: true,
        referralCode: user.referralCode,
        referralPoints: user.referralPoints,
        totalReferrals: user.totalReferrals,
      });
    }

    // Generate new referral code (first 8 chars of user ID + random 4 chars)
    const code = (user._id.toString().substring(0, 8) + crypto.randomBytes(2).toString('hex')).toUpperCase();
    user.referralCode = code;
    await user.save();

    res.status(200).json({
      success: true,
      referralCode: code,
      referralPoints: user.referralPoints,
      totalReferrals: user.totalReferrals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Track referral from code (when new user joins using referral link)
exports.trackReferral = async (req, res) => {
  try {
    const { referralCode } = req.body;
    const userId = req.user.id;

    if (!referralCode) {
      return res.status(400).json({ success: false, message: 'Referral code required' });
    }

    // Find referrer
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }

    // Check if current user already has a referrer
    const currentUser = await User.findById(userId);
    if (currentUser.referredBy) {
      return res.status(400).json({ success: false, message: 'Already using a referral code' });
    }

    // Award points to referrer
    const POINTS_PER_REFERRAL = 100;
    referrer.referralPoints += POINTS_PER_REFERRAL;
    referrer.totalReferrals += 1;
    await referrer.save();

    // Update current user
    currentUser.referredBy = referrer._id;
    await currentUser.save();

    // Create referral record
    const referral = new Referral({
      referrer: referrer._id,
      referrerCode,
      referee: userId,
      pointsAwarded: POINTS_PER_REFERRAL,
      status: 'completed',
      completedAt: new Date(),
    });
    await referral.save();

    res.status(200).json({
      success: true,
      message: 'Referral tracked successfully',
      pointsAwarded: POINTS_PER_REFERRAL,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get referral stats for current user
exports.getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate code if not exists
    let referralCode = user.referralCode;
    if (!referralCode) {
      const crypto = require('crypto');
      referralCode = (user._id.toString().substring(0, 8) + crypto.randomBytes(2).toString('hex')).toUpperCase();
      user.referralCode = referralCode;
      await user.save();
    }

    // Get list of people referred by this user
    const referrals = await Referral.find({ referrer: userId })
      .populate('referee', 'name email')
      .sort({ createdAt: -1 });

    // Map to referredUsers for frontend
    const referredUsers = referrals
      .filter(r => r.referee)
      .map(r => ({
        _id: r.referee._id,
        name: r.referee.name,
        email: r.referee.email,
        createdAt: r.createdAt,
      }));

    res.status(200).json({
      success: true,
      referralCode: referralCode,
      referralPoints: user.referralPoints || 0,
      totalReferrals: user.totalReferrals || 0,
      referredUsers: referredUsers,
    });
  } catch (error) {
    console.error('Error in getReferralStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Redeem points for course purchase
exports.redeemPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;
    const POINTS_REQUIRED = 1000;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.referralPoints < POINTS_REQUIRED) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You need ${POINTS_REQUIRED - user.referralPoints} more points.`,
        currentPoints: user.referralPoints,
        pointsNeeded: POINTS_REQUIRED,
      });
    }

    // Deduct points
    user.referralPoints -= POINTS_REQUIRED;
    await user.save();

    // Log the redemption (optional - can track in separate collection)
    res.status(200).json({
      success: true,
      message: 'Points redeemed successfully! You can now access the course.',
      remainingPoints: user.referralPoints,
      courseId: courseId,
      redeemedPoints: POINTS_REQUIRED,
    });
  } catch (error) {
    console.error('Error in redeemPoints:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to redeem points'
    });
  }
};

// Get all user's referral points history
exports.getReferralHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const referrals = await Referral.find({
      $or: [{ referrer: userId }, { referee: userId }],
    })
      .populate('referrer', 'name email')
      .populate('referee', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: referrals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit referral feature feedback
exports.submitReferralFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rating, message } = req.body;

    if (!rating || !message) {
      return res.status(400).json({
        success: false,
        message: 'Rating and message are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const feedback = await ReferralFeedback.create({
      user: userId,
      rating,
      message,
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error in submitReferralFeedback:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit feedback',
    });
  }
};
