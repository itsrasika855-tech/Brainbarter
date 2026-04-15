const express = require('express');
const Swap = require('../models/Swap');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/swaps
// @desc    Create a swap request
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, requesterSkill, recipientSkill, message } = req.body;

    if (recipientId === req.user.id) {
      return res.status(400).json({ message: 'Cannot swap with yourself' });
    }

    // Check if swap already exists
    const existingSwap = await Swap.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId, status: 'pending' },
        { requester: recipientId, recipient: req.user.id, status: 'pending' }
      ]
    });

    if (existingSwap) {
      return res.status(400).json({ message: 'A pending swap request already exists' });
    }

    // Calculate match score
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(recipientId);

    const myOffered = currentUser.skillsOffered.map(s => s.toLowerCase());
    const theirWanted = targetUser.skillsWanted.map(s => s.toLowerCase());
    const theirOffered = targetUser.skillsOffered.map(s => s.toLowerCase());
    const myWanted = currentUser.skillsWanted.map(s => s.toLowerCase());

    const iCanTeachThem = myOffered.filter(s => theirWanted.includes(s)).length;
    const theyCanTeachMe = theirOffered.filter(s => myWanted.includes(s)).length;
    const totalPossible = Math.max(myOffered.length + myWanted.length, theirOffered.length + theirWanted.length, 1);
    const matchScore = Math.min(Math.round(((iCanTeachThem + theyCanTeachMe) / totalPossible) * 100), 100);

    const swap = new Swap({
      requester: req.user.id,
      recipient: recipientId,
      requesterSkill,
      recipientSkill,
      message: message || '',
      matchScore
    });

    await swap.save();
    await swap.populate('requester', 'name avatar email');
    await swap.populate('recipient', 'name avatar email');

    res.status(201).json(swap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/swaps
// @desc    Get all swaps for the current user
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id }
      ]
    };

    if (status) {
      query.status = status;
    }

    const swaps = await Swap.find(query)
      .populate('requester', 'name avatar email skillsOffered skillsWanted')
      .populate('recipient', 'name avatar email skillsOffered skillsWanted')
      .sort({ createdAt: -1 });

    res.json(swaps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/swaps/:id/accept
// @desc    Accept a swap request
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    if (swap.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (swap.status !== 'pending') {
      return res.status(400).json({ message: 'Swap is not pending' });
    }

    swap.status = 'accepted';
    await swap.save();
    await swap.populate('requester', 'name avatar email');
    await swap.populate('recipient', 'name avatar email');

    res.json(swap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/swaps/:id/reject
// @desc    Reject a swap request
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    if (swap.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    swap.status = 'rejected';
    await swap.save();
    await swap.populate('requester', 'name avatar email');
    await swap.populate('recipient', 'name avatar email');

    res.json(swap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/swaps/:id/complete
// @desc    Mark a swap as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);

    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    const isParticipant = 
      swap.requester.toString() === req.user.id ||
      swap.recipient.toString() === req.user.id;

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (swap.status !== 'accepted') {
      return res.status(400).json({ message: 'Swap must be accepted first' });
    }

    swap.status = 'completed';
    swap.completedAt = new Date();
    await swap.save();

    // Update points and completed swaps count for both users
    await User.findByIdAndUpdate(swap.requester, {
      $inc: { points: 10, completedSwaps: 1 }
    });
    await User.findByIdAndUpdate(swap.recipient, {
      $inc: { points: 10, completedSwaps: 1 }
    });

    // Check and award badges
    for (const userId of [swap.requester, swap.recipient]) {
      const user = await User.findById(userId);
      const badgeNames = user.badges.map(b => b.name);

      if (user.completedSwaps >= 1 && !badgeNames.includes('First Swap')) {
        user.badges.push({ name: 'First Swap', icon: '🎉' });
      }
      if (user.completedSwaps >= 5 && !badgeNames.includes('Skill Trader')) {
        user.badges.push({ name: 'Skill Trader', icon: '⭐' });
      }
      if (user.completedSwaps >= 10 && !badgeNames.includes('Expert Barterer')) {
        user.badges.push({ name: 'Expert Barterer', icon: '🏆' });
      }
      if (user.completedSwaps >= 25 && !badgeNames.includes('BrainBarter Legend')) {
        user.badges.push({ name: 'BrainBarter Legend', icon: '👑' });
      }

      await user.save();
    }

    await swap.populate('requester', 'name avatar email');
    await swap.populate('recipient', 'name avatar email');

    res.json(swap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
