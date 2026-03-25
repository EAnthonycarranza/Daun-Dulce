const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  customerName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  contact: {
    type: String,
    trim: true,
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  contactPhone: {
    type: String,
    trim: true,
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required'],
  },
  quantityOther: {
    type: String,
    trim: true,
  },
  flavors: {
    type: [String],
    required: [true, 'At least one flavor is required'],
    validate: {
      validator: (v) => v.length > 0,
      message: 'At least one flavor must be selected',
    },
  },
  flavorOther: {
    type: String,
    trim: true,
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
  },
  pickupDate: {
    type: String,
    required: [true, 'Pickup date is required'],
  },
  termsAccepted: {
    type: Boolean,
    required: [true, 'Terms must be accepted'],
    validate: {
      validator: (v) => v === true,
      message: 'All terms must be accepted',
    },
  },
  specialRequests: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  // Email confirmation
  confirmationToken: {
    type: String,
    default: () => require('crypto').randomBytes(32).toString('hex'),
  },
  emailConfirmed: {
    type: Boolean,
    default: false,
  },
  confirmationSentAt: {
    type: Date,
    default: null,
  },
  // Telegram chat ID (for phone notifications via Telegram bot)
  telegramChatId: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);
