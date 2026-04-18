const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    unique: true,
    enum: ['about', 'preorder'],
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SiteContent', siteContentSchema);
