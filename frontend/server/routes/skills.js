const express = require('express');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/skills
// @desc    Create a new skill post
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, level, type, tags } = req.body;

    if (!title || !description || !category || !type) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const skill = new Skill({
      title,
      description,
      category,
      level: level || 'Beginner',
      type,
      tags: tags || [],
      user: req.user.id
    });

    await skill.save();
    await skill.populate('user', 'name avatar email');

    res.status(201).json(skill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/skills
// @desc    Get all skills with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, type, search, level } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }
    if (level) {
      query.level = level;
    }
    if (search) {
      query.$text = { $search: search };
    }

    const skills = await Skill.find(query)
      .populate('user', 'name avatar email skillsOffered skillsWanted averageRating')
      .sort({ createdAt: -1 });

    res.json(skills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/skills/user/:userId
// @desc    Get skills by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.params.userId })
      .populate('user', 'name avatar email')
      .sort({ createdAt: -1 });

    res.json(skills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/skills/:id
// @desc    Get a single skill by ID
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('user', 'name avatar email skillsOffered skillsWanted');

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    res.json(skill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/skills/:id
// @desc    Update a skill
router.put('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    if (skill.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, category, level, type, tags } = req.body;
    if (title) skill.title = title;
    if (description) skill.description = description;
    if (category) skill.category = category;
    if (level) skill.level = level;
    if (type) skill.type = type;
    if (tags) skill.tags = tags;

    await skill.save();
    await skill.populate('user', 'name avatar email');

    res.json(skill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/skills/:id
// @desc    Delete a skill
router.delete('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    if (skill.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
