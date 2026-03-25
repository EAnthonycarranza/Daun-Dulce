const express = require('express');
const multer = require('multer');
const Cookie = require('../models/Cookie');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToGCS, deleteFromGCS } = require('../middleware/upload');

const router = express.Router();

// Multer error handler middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image is too large. Maximum file size is 20MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'File upload failed' });
  }
  next();
};

// Public: Get all available cookies
router.get('/', async (req, res) => {
  try {
    const { featured } = req.query;
    const filter = { available: true };

    if (featured === 'true') {
      filter.featured = true;
    }

    const cookies = await Cookie.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.json(cookies);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all cookies (including unavailable)
router.get('/admin', auth, async (req, res) => {
  try {
    const cookies = await Cookie.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(cookies);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create a cookie
router.post('/', auth, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const { name, description, tags, featured, available, sortOrder } = req.body;

    const cookieData = {
      name,
      description,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      featured: featured === 'true' || featured === true,
      available: available !== 'false' && available !== false,
      sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
    };

    if (req.file) {
      cookieData.image = await uploadToGCS(req.file);
    }

    const cookie = await Cookie.create(cookieData);
    res.status(201).json(cookie);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Create cookie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update a cookie
router.put('/:id', auth, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const { name, description, tags, featured, available, sortOrder } = req.body;

    const updateData = {
      name,
      description,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      featured: featured === 'true' || featured === true,
      available: available !== 'false' && available !== false,
      sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
    };

    if (req.file) {
      // Delete old image from GCS
      const existing = await Cookie.findById(req.params.id);
      if (existing?.image) {
        await deleteFromGCS(existing.image);
      }
      updateData.image = await uploadToGCS(req.file);
    }

    const cookie = await Cookie.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!cookie) return res.status(404).json({ message: 'Cookie not found' });
    res.json(cookie);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Update cookie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete a cookie
router.delete('/:id', auth, async (req, res) => {
  try {
    const cookie = await Cookie.findByIdAndDelete(req.params.id);
    if (!cookie) return res.status(404).json({ message: 'Cookie not found' });

    // Delete associated image from GCS
    if (cookie.image) {
      await deleteFromGCS(cookie.image);
    }

    res.json({ message: 'Cookie deleted' });
  } catch (err) {
    console.error('Delete cookie error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete a cookie's image
router.delete('/:id/image', auth, async (req, res) => {
  try {
    const cookie = await Cookie.findById(req.params.id);
    if (!cookie) return res.status(404).json({ message: 'Cookie not found' });

    if (cookie.image) {
      await deleteFromGCS(cookie.image);
    }

    cookie.image = null;
    await cookie.save();
    res.json(cookie);
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
