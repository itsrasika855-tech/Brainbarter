const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  swap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Swap',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews for the same swap by same user
reviewSchema.index({ swap: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
