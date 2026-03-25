const mongoose = require('mongoose');

const cookieSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cookie name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  image: {
    type: String,
    default: null,
  },
  tags: {
    type: [String],
    default: [],
  },
  featured: {
    type: Boolean,
    default: false,
  },
  available: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Cookie', cookieSchema);
