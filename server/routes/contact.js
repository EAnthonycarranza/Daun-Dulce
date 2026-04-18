const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendContactMessage } = require('../utils/sendEmail');

const router = express.Router();

router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Honeypot check — if this hidden field has a value, it's a bot
    if (req.body.website) {
      // Pretend it succeeded so bots think they won
      return res.json({ message: 'Message sent successfully!' });
    }

    // CAPTCHA verification — answer must match
    const { captchaAnswer, captchaInput } = req.body;
    if (
      captchaAnswer === undefined ||
      captchaInput === undefined ||
      parseInt(captchaInput, 10) !== parseInt(captchaAnswer, 10)
    ) {
      return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }

    // Time-based check — real humans take at least a few seconds
    const timing = parseFloat(req.body._timing);
    if (!timing || timing < 2) {
      return res.status(400).json({ message: 'Please take a moment before submitting.' });
    }

    try {
      const { name, email, message } = req.body;
      await sendContactMessage(name, email, message);
      res.json({ message: 'Message sent successfully!' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to send message' });
    }
  }
);

module.exports = router;
