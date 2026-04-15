const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Skill title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 1000
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Tech', 'Music', 'Design', 'Language', 'Sports', 'Cooking', 'Art', 'Business', 'Science', 'Other']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['offered', 'wanted'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for search
skillSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Skill', skillSchema);
