const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '24h' }
    );

    res.json({ token, username: admin.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/verify', auth, (req, res) => {
  res.json({ valid: true, username: req.admin.username });
});

module.exports = router;
