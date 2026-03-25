const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const {
  sendOrderNotification,
  sendCustomerConfirmationEmail,
  sendStatusUpdateEmail,
} = require('../utils/sendEmail');
const {
  sendTelegramStatusUpdate,
  sendTelegramConfirmationReminder,
} = require('../utils/telegramBot');

const router = express.Router();

// Public: Submit a new pre-order
router.post('/',
  [
    body('quantity').notEmpty().withMessage('Quantity is required'),
    body('flavors').isArray({ min: 1 }).withMessage('At least one flavor is required'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required'),
    body('pickupDate').notEmpty().withMessage('Pickup date is required'),
    body('termsAccepted').equals('true').withMessage('Terms must be accepted'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if customer is logged in
      const header = req.headers.authorization;
      let customerId = null;
      let customerData = null;

      if (header && header.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
          if (decoded.customerId) {
            customerId = decoded.customerId;
            customerData = await Customer.findById(customerId).select('name email phone');
          }
        } catch { /* guest order */ }
      }

      let orderData;

      if (customerData) {
        // Logged-in customer: use their account info
        orderData = {
          customer: customerId,
          customerName: customerData.name,
          contactEmail: customerData.email,
          contactPhone: customerData.phone,
          contact: `${customerData.email} / ${customerData.phone}`,
          quantity: req.body.quantity,
          quantityOther: req.body.quantityOther,
          flavors: req.body.flavors,
          flavorOther: req.body.flavorOther,
          paymentMethod: req.body.paymentMethod,
          pickupDate: req.body.pickupDate,
          termsAccepted: req.body.termsAccepted,
          specialRequests: req.body.specialRequests,
        };
      } else {
        // Guest: require name, email, and phone
        if (!req.body.customerName || !req.body.customerName.trim()) {
          return res.status(400).json({ message: 'Name is required' });
        }
        if (!req.body.contactEmail || !req.body.contactEmail.trim()) {
          return res.status(400).json({ message: 'Email is required' });
        }
        if (!req.body.contactPhone || !req.body.contactPhone.trim()) {
          return res.status(400).json({ message: 'Phone number is required' });
        }

        orderData = {
          customerName: req.body.customerName.trim(),
          contactEmail: req.body.contactEmail.trim(),
          contactPhone: req.body.contactPhone.trim(),
          contact: `${req.body.contactEmail.trim()} / ${req.body.contactPhone.trim()}`,
          quantity: req.body.quantity,
          quantityOther: req.body.quantityOther,
          flavors: req.body.flavors,
          flavorOther: req.body.flavorOther,
          paymentMethod: req.body.paymentMethod,
          pickupDate: req.body.pickupDate,
          termsAccepted: req.body.termsAccepted,
          specialRequests: req.body.specialRequests,
        };
      }

      const order = await Order.create(orderData);

      // Update confirmation sent timestamp
      order.confirmationSentAt = new Date();
      await order.save();

      // Send notifications (fire and forget)
      sendOrderNotification(order);
      sendCustomerConfirmationEmail(order);

      res.status(201).json({
        message: 'Order submitted successfully! Check your email to confirm.',
        order,
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(', ') });
      }
      console.error('Order creation error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Public: Confirm order via email token
router.get('/confirm/:token', async (req, res) => {
  try {
    const order = await Order.findOne({ confirmationToken: req.params.token });

    if (!order) {
      return res.status(404).json({ message: 'Invalid or expired confirmation link.' });
    }

    if (order.emailConfirmed) {
      return res.json({ message: 'Order already confirmed!', alreadyConfirmed: true, order });
    }

    order.emailConfirmed = true;
    await order.save();

    res.json({ message: 'Order confirmed successfully!', order });
  } catch (err) {
    console.error('Confirmation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: Get Telegram bot name (for building the t.me link)
router.get('/telegram-bot', (req, res) => {
  res.json({
    botName: process.env.TELEGRAM_BOT_USERNAME || '',
    enabled: !!process.env.TELEGRAM_BOT_TOKEN,
  });
});

// Public: Track order by Order # (last 6 chars of _id)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const orderNum = req.params.orderNumber.replace(/^#/, '').trim();

    if (!/^[a-f0-9]{6}$/i.test(orderNum)) {
      return res.status(400).json({ message: 'Invalid Order #. Please enter the 6-character code.' });
    }

    // Find orders whose _id ends with this 6-char hex string
    const orders = await Order.find({
      _id: { $regex: orderNum + '$', $options: 'i' },
    }).select('customerName status flavors flavorOther quantity quantityOther paymentMethod pickupDate specialRequests emailConfirmed telegramChatId createdAt');

    if (!orders.length) {
      return res.status(404).json({ message: 'No order found with that Order #.' });
    }

    res.json(orders[0]);
  } catch (err) {
    console.error('Track order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, search, sort = '-createdAt' } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      // Strip leading # if user types "#A3F2B1"
      const cleanSearch = search.replace(/^#/, '').trim();

      filter.$or = [
        { customerName: { $regex: cleanSearch, $options: 'i' } },
        { contact: { $regex: cleanSearch, $options: 'i' } },
        { contactEmail: { $regex: cleanSearch, $options: 'i' } },
        { contactPhone: { $regex: cleanSearch, $options: 'i' } },
      ];

      // Also search by Order # (last 6 chars of _id)
      // If the search looks like a hex string (2-24 chars), match _id ending
      if (/^[a-f0-9]{2,24}$/i.test(cleanSearch)) {
        filter.$or.push(
          { _id: { $regex: cleanSearch + '$', $options: 'i' } }
        );
      }
    }

    const orders = await Order.find(filter).sort(sort);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update order status (with email + Telegram notification)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Send status update via email + Telegram
    sendStatusUpdateEmail(order, status);
    sendTelegramStatusUpdate(order, status);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Resend confirmation email and/or Telegram
router.post('/:id/resend-confirmation', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const method = req.body.method || 'all'; // 'email', 'telegram', or 'all'

    order.confirmationSentAt = new Date();
    await order.save();

    let emailSent = false;
    let telegramSent = false;

    if (method === 'email' || method === 'all') {
      emailSent = !!(await sendCustomerConfirmationEmail(order));
    }
    if (method === 'telegram' || method === 'all') {
      telegramSent = !!(await sendTelegramConfirmationReminder(order));
    }

    res.json({
      message: 'Confirmation resent',
      emailSent,
      telegramSent,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete order
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
