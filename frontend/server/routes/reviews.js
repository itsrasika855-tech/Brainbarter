const express = require('express');
const Review = require('../models/Review');
const User = require('../models/User');
const Swap = require('../models/Swap');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a review
router.post('/', auth, async (req, res) => {
  try {
    const { swapId, revieweeId, rating, comment } = req.body;

    // Verify swap exists and is completed
    const swap = await Swap.findById(swapId);
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }
    if (swap.status !== 'completed') {
      return res.status(400).json({ message: 'Swap must be completed before reviewing' });
    }

    // Verify user is participant
    const isParticipant =
      swap.requester.toString() === req.user.id ||
      swap.recipient.toString() === req.user.id;
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      swap: swapId,
      reviewer: req.user.id
    });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this swap' });
    }

    const review = new Review({
      swap: swapId,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating,
      comment: comment || ''
    });

    await review.save();

    // Update reviewee's average rating
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await User.findByIdAndUpdate(revieweeId, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: allReviews.length
    });

    // Award badge for high rating
    if (avgRating >= 4.5 && allReviews.length >= 3) {
      const user = await User.findById(revieweeId);
      if (!user.badges.find(b => b.name === 'Top Rated')) {
        user.badges.push({ name: 'Top Rated', icon: '🌟' });
        await user.save();
      }
    }

    await review.populate('reviewer', 'name avatar');
    await review.populate('reviewee', 'name avatar');

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .populate('swap', 'requesterSkill recipientSkill')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
