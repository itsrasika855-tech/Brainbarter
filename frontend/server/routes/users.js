const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, skillsOffered, skillsWanted } = req.body;
    
    const updateFields = {};
    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (skillsOffered) updateFields.skillsOffered = skillsOffered;
    if (skillsWanted) updateFields.skillsWanted = skillsWanted;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/avatar
// @desc    Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/match/:id
// @desc    Get match score with another user
router.get('/match/:id', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate match score
    const myOffered = currentUser.skillsOffered.map(s => s.toLowerCase());
    const myWanted = currentUser.skillsWanted.map(s => s.toLowerCase());
    const theirOffered = targetUser.skillsOffered.map(s => s.toLowerCase());
    const theirWanted = targetUser.skillsWanted.map(s => s.toLowerCase());

    // Check if my offered skills match their wanted skills
    const iCanTeachThem = myOffered.filter(s => theirWanted.includes(s)).length;
    // Check if their offered skills match my wanted skills
    const theyCanTeachMe = theirOffered.filter(s => myWanted.includes(s)).length;

    const totalPossible = Math.max(
      myOffered.length + myWanted.length,
      theirOffered.length + theirWanted.length,
      1
    );
    
    const matchScore = Math.round(((iCanTeachThem + theyCanTeachMe) / totalPossible) * 100);

    res.json({
      matchScore: Math.min(matchScore, 100),
      iCanTeach: myOffered.filter(s => theirWanted.includes(s)),
      theyCanTeach: theirOffered.filter(s => myWanted.includes(s))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/all
// @desc    Get all users (for explore page)
router.get('/all', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
