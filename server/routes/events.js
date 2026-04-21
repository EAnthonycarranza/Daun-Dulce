const express = require('express');
const multer = require('multer');
const Event = require('../models/Event');
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

// Public: Get events (upcoming and past week)
router.get('/', async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Show events that haven't happened yet OR happened within the last 7 days
    const events = await Event.find({
      date: { $gte: oneWeekAgo }
    }).sort({ date: 1 });

    res.json(events);
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all events
router.get('/admin', auth, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create an event
router.post('/', auth, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const { title, description, date, location, time, link } = req.body;

    const eventData = {
      title,
      description,
      date,
      location,
      time,
      link,
    };

    if (req.file) {
      eventData.image = await uploadToGCS(req.file);
    }

    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Create event error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update an event
router.put('/:id', auth, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const { title, description, date, location, time, link } = req.body;

    const updateData = {
      title,
      description,
      date,
      location,
      time,
      link,
    };

    if (req.file) {
      const existing = await Event.findById(req.params.id);
      if (existing?.image) {
        await deleteFromGCS(existing.image);
      }
      updateData.image = await uploadToGCS(req.file);
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Update event error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete an event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.image) {
      await deleteFromGCS(event.image);
    }

    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete an event's image
router.delete('/:id/image', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.image) {
      await deleteFromGCS(event.image);
    }

    event.image = null;
    await event.save();
    res.json(event);
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
