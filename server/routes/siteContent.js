const express = require('express');
const SiteContent = require('../models/SiteContent');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToGCS, deleteFromGCS } = require('../middleware/upload');

const router = express.Router();

// Default content for seeding
const DEFAULTS = {
  about: {
    heading: 'About Daun Dulce',
    subtitle: 'Our story, one cookie at a time',
    storyTitle: 'Made with Love',
    storyParagraphs: [
      'Daun Dulce was born from a simple love of baking and a desire to share something sweet with our community. What started as cookies for friends and family quickly grew into something we\'re truly passionate about.',
      'Every cookie we make is baked fresh from scratch -- using quality ingredients and tried-and-true recipes. We believe that the best cookies are soft, gooey, and made with love in every single bite.',
      '"Daun Dulce" combines the beauty of nature with the sweetness of life. It\'s more than just a cookie brand -- it\'s a reminder to slow down and enjoy the little things.',
    ],
    image: null,
    valuesTitle: 'What Sets Us Apart',
    values: [
      { icon: '🍪', title: 'Fresh Baked', description: 'Every order is baked fresh -- never frozen, never stale. Always soft and gooey.' },
      { icon: '❤️', title: 'Made with Love', description: 'We pour care into every batch, using quality ingredients you can taste.' },
      { icon: '✨', title: 'Unique Flavors', description: 'From classic chocolate chip to our signature creations, there\'s something for everyone.' },
    ],
    ctaTitle: 'Ready to Try Our Cookies?',
    ctaSubtitle: 'We\'d love for you to taste the difference!',
  },
  preorder: {
    heading: 'Daun Dulce Pre-Order Form',
    subtitle: 'Reserve your fresh-baked cookies today!',
    introParagraphs: [
      'Hi there! We\'re so happy you\'re here! ✨',
      'Thank you for choosing us to satisfy your sweet cravings!',
      'All of our cookies are baked fresh -- soft, gooey, and made with love in every bite 🍪',
      'Please fill out the form below to reserve your order. Once submitted, we\'ll send a confirmation with payment details.',
      'We can\'t wait for you to try our cookies 🤍',
      'Thank you for choosing us -- it truly means a lot!',
    ],
    quantities: [
      '1 pc - $3.50',
      '4 pcs - $13.75',
      '6 pcs - $20.00',
      '30 pcs - $100.00',
      'Mini Cookies - $3.50',
      'Brownie Bites - $4.00',
    ],
    paymentMethods: ['Debit/Credit Card', 'Zelle', 'CashApp', 'Apple Pay'],
    pickupDates: ['Saturday 10 AM - 12 PM', 'Sunday 10 AM - 12 PM'],
    terms: [
      'I understand that my order is not confirmed until I receive a confirmation message/email.',
      'I agree that full payment is required to secure my order. Unpaid orders may be canceled.',
      'I acknowledge that I am responsible for arriving at my selected pickup date and time.',
      'I understand that missed pickups may not be refunded.',
      'I agree that all sales are final. No cancellations or refunds once payment is made.',
      'I understand that products may contain or come in contact with allergens (wheat, dairy, eggs, soy, nuts).',
    ],
    successTitle: 'Order Submitted!',
    successMessage: 'Thank you for your pre-order! We\'ll send you a confirmation with payment details soon.',
    successNote: 'We can\'t wait for you to try our cookies!',
  },
};

// Public: Get page content
router.get('/:page', async (req, res) => {
  try {
    const { page } = req.params;
    if (!['about', 'preorder'].includes(page)) {
      return res.status(400).json({ message: 'Invalid page' });
    }

    let doc = await SiteContent.findOne({ page });
    if (!doc) {
      // Seed default and return it
      doc = await SiteContent.create({ page, content: DEFAULTS[page] });
    }
    res.json(doc.content);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update page content
router.put('/:page', auth, upload.single('image'), async (req, res) => {
  try {
    const { page } = req.params;
    if (!['about', 'preorder'].includes(page)) {
      return res.status(400).json({ message: 'Invalid page' });
    }

    const content = JSON.parse(req.body.content);

    // Handle image upload for about page
    if (req.file) {
      content.image = await uploadToGCS(req.file);

      // Delete old image if exists
      const existing = await SiteContent.findOne({ page });
      if (existing?.content?.image) {
        await deleteFromGCS(existing.content.image);
      }
    }

    const doc = await SiteContent.findOneAndUpdate(
      { page },
      { content },
      { new: true, upsert: true }
    );

    res.json(doc.content);
  } catch (err) {
    console.error('Update site content error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Remove about page image
router.delete('/:page/image', auth, async (req, res) => {
  try {
    const doc = await SiteContent.findOne({ page: req.params.page });
    if (doc?.content?.image) {
      await deleteFromGCS(doc.content.image);
      doc.content.image = null;
      doc.markModified('content');
      await doc.save();
    }
    res.json({ message: 'Image removed' });
  } catch (err) {
    console.error('Delete site image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
