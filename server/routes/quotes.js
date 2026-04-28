const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Quote = require('../models/Quote');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const {
  sendQuoteRequestNotification,
  sendQuoteReceivedEmail,
  sendQuoteResponseEmail,
  sendQuoteAcceptedNotification,
} = require('../utils/sendEmail');

const router = express.Router();

// Public: Submit a group-event quote request
router.post('/',
  [
    body('customerName').trim().notEmpty().withMessage('Name is required'),
    body('contactEmail').trim().isEmail().withMessage('Valid email is required'),
    body('contactPhone').trim().notEmpty().withMessage('Phone is required'),
    body('eventType').isIn(Quote.EVENT_TYPES).withMessage('Invalid event type'),
    body('guestCount').isInt({ min: 1 }).withMessage('Guest count must be at least 1'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Honeypot check
    if (req.body.website) {
      return res.status(201).json({
        message: 'Quote request received. We\'ll reach out shortly with a custom quote.',
        quote: { _id: 'fake', status: 'new' },
      });
    }

    // CAPTCHA verification
    const { captchaAnswer, captchaInput } = req.body;
    if (
      captchaAnswer === undefined ||
      captchaInput === undefined ||
      parseInt(captchaInput, 10) !== parseInt(captchaAnswer, 10)
    ) {
      return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }

    // Time-based check
    const timing = parseFloat(req.body._timing);
    if (!timing || timing < 2) {
      return res.status(400).json({ message: 'Please take a moment before submitting.' });
    }

    try {
      // Link to logged-in customer if token present
      let customerId = null;
      const header = req.headers.authorization;
      if (header && header.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
          if (decoded.customerId) customerId = decoded.customerId;
        } catch { /* guest */ }
      }

      // Delivery is reserved for catering-sized orders. Smaller orders are pickup-only.
      const DELIVERY_MIN_GUESTS = 50;
      const guestCount = Number(req.body.guestCount);
      const requestedFulfillment = req.body.fulfillment === 'delivery' ? 'delivery' : 'pickup';
      const fulfillment =
        requestedFulfillment === 'delivery' && guestCount >= DELIVERY_MIN_GUESTS ? 'delivery' : 'pickup';

      const data = {
        customer: customerId,
        customerName: req.body.customerName.trim(),
        contactEmail: req.body.contactEmail.trim(),
        contactPhone: req.body.contactPhone.trim(),
        organization: req.body.organization?.trim() || '',
        eventType: req.body.eventType,
        eventTypeOther: req.body.eventTypeOther?.trim() || '',
        eventName: req.body.eventName?.trim() || '',
        eventDate: req.body.eventDate || '',
        dateFlexible: !!req.body.dateFlexible,
        guestCount,
        flavors: Array.isArray(req.body.flavors) ? req.body.flavors : [],
        flavorNotes: req.body.flavorNotes?.trim() || '',
        budgetRange: req.body.budgetRange?.trim() || '',
        fulfillment,
        deliveryAddress: fulfillment === 'delivery' ? (req.body.deliveryAddress?.trim() || '') : '',
        deliveryLat: fulfillment === 'delivery' && Number.isFinite(Number(req.body.deliveryLat)) ? Number(req.body.deliveryLat) : null,
        deliveryLng: fulfillment === 'delivery' && Number.isFinite(Number(req.body.deliveryLng)) ? Number(req.body.deliveryLng) : null,
        deliveryPlaceId: fulfillment === 'delivery' ? (req.body.deliveryPlaceId?.trim() || '') : '',
        details: req.body.details?.trim() || '',
        referral: req.body.referral?.trim() || '',
      };

      const quote = await Quote.create(data);

      // Fire-and-forget notifications
      sendQuoteRequestNotification(quote);
      sendQuoteReceivedEmail(quote);

      res.status(201).json({
        message: 'Quote request received. We\'ll reach out shortly with a custom quote.',
        quote: { _id: quote._id, status: quote.status },
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(', ') });
      }
      console.error('Quote creation error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Public: Look up a quote by response token (for accept/decline page)
router.get('/respond/:token', async (req, res) => {
  try {
    const quote = await Quote.findOne({ responseToken: req.params.token });
    if (!quote) return res.status(404).json({ message: 'Quote not found.' });

    // Return only what the customer needs
    res.json({
      _id: quote._id,
      customerName: quote.customerName,
      eventType: quote.eventType,
      eventTypeOther: quote.eventTypeOther,
      eventName: quote.eventName,
      eventDate: quote.eventDate,
      guestCount: quote.guestCount,
      flavors: quote.flavors,
      fulfillment: quote.fulfillment,
      deliveryAddress: quote.deliveryAddress,
      quote: quote.quote,
      status: quote.status,
      createdAt: quote.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: Customer accepts or declines a quote
router.post('/respond/:token', async (req, res) => {
  try {
    const { action } = req.body;
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const quote = await Quote.findOne({ responseToken: req.params.token });
    if (!quote) return res.status(404).json({ message: 'Quote not found.' });

    if (quote.status !== 'quoted') {
      return res.status(400).json({
        message: `This quote can no longer be ${action}ed. Current status: ${quote.status}.`,
      });
    }

    quote.status = action === 'accept' ? 'accepted' : 'declined';
    quote.quote.respondedAt = new Date();
    quote.quote.respondedBy = 'customer';
    await quote.save();

    sendQuoteAcceptedNotification(quote, action);

    res.json({ message: `Quote ${quote.status}. Thank you!`, status: quote.status });
  } catch (err) {
    console.error('Quote response error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: monthly stats for the last N months (default 12)
router.get('/stats/monthly', auth, async (req, res) => {
  try {
    const months = Math.max(1, Math.min(24, Number(req.query.months) || 12));
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1), 1);
    start.setHours(0, 0, 0, 0);

    const rows = await Quote.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          count: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          quoted: { $sum: { $cond: [{ $eq: ['$status', 'quoted'] }, 1, 0] } },
          declined: { $sum: { $cond: [{ $eq: ['$status', 'declined'] }, 1, 0] } },
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$status', ['accepted', 'completed']] },
                { $ifNull: ['$quote.total', 0] },
                0,
              ],
            },
          },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    const series = [];
    const cursor = new Date(start);
    for (let i = 0; i < months; i += 1) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      const found = rows.find((r) => r._id.y === y && r._id.m === m);
      series.push({
        year: y,
        month: m,
        label: cursor.toLocaleDateString('en-US', { month: 'short' }),
        count: found?.count || 0,
        accepted: found?.accepted || 0,
        quoted: found?.quoted || 0,
        declined: found?.declined || 0,
        revenue: Math.round((found?.revenue || 0) * 100) / 100,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const totalAll = await Quote.countDocuments();
    res.json({ months, series, totalAll });
  } catch (err) {
    console.error('Quote stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list all quotes (filter + search)
router.get('/', auth, async (req, res) => {
  try {
    const { status, search, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      const s = search.trim();
      filter.$or = [
        { customerName: { $regex: s, $options: 'i' } },
        { contactEmail: { $regex: s, $options: 'i' } },
        { contactPhone: { $regex: s, $options: 'i' } },
        { organization: { $regex: s, $options: 'i' } },
        { eventName: { $regex: s, $options: 'i' } },
      ];
    }
    const quotes = await Quote.find(filter).sort(sort);
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: single quote
router.get('/:id', auth, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: update status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!Quote.STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const quote = await Quote.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Send the quote response to the customer (moves to 'quoted' status)
router.post('/:id/send-quote', auth, async (req, res) => {
  try {
    const { items, isItemized = false, fees = 0, notes = '', validUntil = '' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required.' });
    }

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const ppu = Number(item.pricePerUnit);
      const qty = Number(item.quantity);
      if ((isItemized && !item.name) || !ppu || !qty || ppu <= 0 || qty <= 0) {
        return res.status(400).json({ message: 'Each item must have a valid price and quantity. Item names are required for itemized quotes.' });
      }
      subtotal += ppu * qty;
      processedItems.push({
        name: isItemized ? item.name.trim() : (item.name?.trim() || 'Custom Cookies'),
        unitLabel: item.unitLabel?.trim() || 'unit',
        quantity: qty,
        pricePerUnit: ppu,
      });
    }

    const fee = Number(fees) || 0;
    subtotal = Math.round(subtotal * 100) / 100;
    const total = Math.round((subtotal + fee) * 100) / 100;

    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    quote.quote = {
      items: processedItems,
      isItemized: !!isItemized,
      subtotal,
      fees: fee,
      total,
      notes: notes || '',
      validUntil: validUntil || '',
      sentAt: new Date(),
      respondedAt: null,
      respondedBy: null,
    };
    quote.status = 'quoted';
    await quote.save();

    const emailSent = await sendQuoteResponseEmail(quote);

    res.json({ message: 'Quote sent to customer.', emailSent: !!emailSent, quote });
  } catch (err) {
    console.error('Send quote error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete quote
router.delete('/:id', auth, async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    res.json({ message: 'Quote deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
