const express = require('express');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/leaderboard
// @desc    Get top users
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('name avatar points completedSwaps averageRating badges')
      .sort({ points: -1, completedSwaps: -1 })
      .limit(20);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
