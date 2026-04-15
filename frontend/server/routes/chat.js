const express = require('express');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/chat/:swapId
// @desc    Get chat messages for a swap
router.get('/:swapId', auth, async (req, res) => {
  try {
    const messages = await Chat.find({ swap: req.params.swapId })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat
// @desc    Send a message (fallback for non-socket clients)
router.post('/', auth, async (req, res) => {
  try {
    const { swapId, receiverId, message } = req.body;

    const newMessage = new Chat({
      swap: swapId,
      sender: req.user.id,
      receiver: receiverId,
      message
    });

    await newMessage.save();
    await newMessage.populate('sender', 'name avatar');
    await newMessage.populate('receiver', 'name avatar');

    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/read/:swapId
// @desc    Mark messages as read
router.put('/read/:swapId', auth, async (req, res) => {
  try {
    await Chat.updateMany(
      { swap: req.params.swapId, receiver: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
