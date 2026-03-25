const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const customerAuth = require('../middleware/customerAuth');
const auth = require('../middleware/auth');

const router = express.Router();

// Public: Register a new customer
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { name, email, phone, password } = req.body;

      const existing = await Customer.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }

      const customer = await Customer.create({ name, email, phone, password });

      const token = jwt.sign(
        { customerId: customer._id, email: customer.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone },
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Public: Customer login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { email, password, rememberMe } = req.body;

      const customer = await Customer.findOne({ email });
      if (!customer) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await customer.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { customerId: customer._id, email: customer.email },
        process.env.JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '7d' }
      );

      res.json({
        token,
        customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone },
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Customer: Verify token
router.get('/verify', customerAuth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.customerId).select('-password');
    if (!customer) {
      return res.status(401).json({ message: 'Customer not found' });
    }
    res.json({ customer: { id: customer._id, name: customer.name, email: customer.email, phone: customer.phone } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Customer: Get my orders
router.get('/my-orders', customerAuth, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.customer.customerId }).sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all customers
router.get('/all', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(filter).select('-password').sort('-createdAt');

    // Get order counts for each customer
    const customerData = await Promise.all(
      customers.map(async (c) => {
        const orderCount = await Order.countDocuments({ customer: c._id });
        return { ...c.toObject(), orderCount };
      })
    );

    res.json(customerData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get a single customer's profile
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const orders = await Order.find({ customer: req.params.id }).sort('-createdAt');
    const orderCount = orders.length;

    res.json({ ...customer.toObject(), orderCount, orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get a customer's orders
router.get('/:id/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.id }).sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
