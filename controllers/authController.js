const User = require('../models/User.js');
const Referral = require('../models/Referral');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phone, referralCode } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Optional referral code validation
    let referrer = null;
    if (referralCode && referralCode.trim()) {
      referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
      if (!referrer) {
        return res.status(400).json({
          success: false,
          error: 'Invalid referral code'
        });
      }
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      phone,
      referredBy: referrer ? referrer._id : null,
    });

    // Ensure every user gets a referral code at signup
    if (!user.referralCode) {
      let generatedCode = '';
      let attempts = 0;
      do {
        generatedCode = (user._id.toString().substring(0, 8) + crypto.randomBytes(2).toString('hex')).toUpperCase();
        attempts += 1;
      } while (await User.findOne({ referralCode: generatedCode }) && attempts < 5);

      user.referralCode = generatedCode;
    }

    // Reward both users when referral code is used
    if (referrer) {
      const REFERRER_POINTS = 100;
      const REFEREE_BONUS_POINTS = 25;

      referrer.referralPoints = (referrer.referralPoints || 0) + REFERRER_POINTS;
      referrer.totalReferrals = (referrer.totalReferrals || 0) + 1;

      user.referralPoints = (user.referralPoints || 0) + REFEREE_BONUS_POINTS;

      await referrer.save();

      await Referral.create({
        referrer: referrer._id,
        referrerCode: referrer.referralCode,
        referee: user._id,
        refereeEmail: user.email,
        pointsAwarded: REFERRER_POINTS,
        status: 'completed',
        completedAt: new Date(),
      });
    }

    await user.save();

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};


exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};


exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token
  });
};