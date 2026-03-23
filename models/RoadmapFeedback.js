const mongoose = require('mongoose');

const RoadmapFeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    careerPath: {
      type: String,
      required: true,
      trim: true,
    },
    ratings: {
      contentQuality: { type: Number, min: 0, max: 5, default: 0 },
      clarity: { type: Number, min: 0, max: 5, default: 0 },
      effectiveness: { type: Number, min: 0, max: 5, default: 0 },
      overall: { type: Number, min: 0, max: 5, default: 0 },
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RoadmapFeedback', RoadmapFeedbackSchema);
