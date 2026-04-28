const mongoose = require('mongoose');
const crypto = require('crypto');

const EVENT_TYPES = ['wedding', 'corporate', 'fundraiser', 'birthday', 'baby-shower', 'holiday', 'other'];
const FULFILLMENT = ['pickup', 'delivery'];
const STATUSES = ['new', 'quoted', 'accepted', 'declined', 'completed', 'archived'];

const quoteSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  // Requestor
  customerName: { type: String, required: true, trim: true },
  contactEmail: { type: String, required: true, trim: true, lowercase: true },
  contactPhone: { type: String, required: true, trim: true },
  organization: { type: String, trim: true },

  // Event details
  eventType: { type: String, enum: EVENT_TYPES, required: true },
  eventTypeOther: { type: String, trim: true },
  eventName: { type: String, trim: true },
  eventDate: { type: String, trim: true },
  dateFlexible: { type: Boolean, default: false },
  guestCount: { type: Number, min: 1, required: true },

  // Product details
  flavors: { type: [String], default: [] },
  flavorNotes: { type: String, trim: true },
  dietary: { type: [String], default: [] },
  budgetRange: { type: String, trim: true },

  // Fulfillment
  fulfillment: { type: String, enum: FULFILLMENT, default: 'pickup' },
  deliveryAddress: { type: String, trim: true },
  deliveryLat: { type: Number, default: null },
  deliveryLng: { type: Number, default: null },
  deliveryPlaceId: { type: String, default: '' },

  // Free-form
  details: { type: String, trim: true },
  referral: { type: String, trim: true },

  // Quote response (filled in by admin)
  quote: {
    items: [{
      name: { type: String, required: true },
      unitLabel: { type: String, default: 'unit' },
      quantity: { type: Number, required: true },
      pricePerUnit: { type: Number, required: true },
    }],
    isItemized: { type: Boolean, default: false },
    subtotal: { type: Number, default: null },
    fees: { type: Number, default: 0 },
    total: { type: Number, default: null },
    notes: { type: String, default: '' },
    validUntil: { type: String, default: '' },
    sentAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
    respondedBy: { type: String, default: null },
  },

  status: { type: String, enum: STATUSES, default: 'new' },

  // Token for customer to accept/decline from email
  responseToken: {
    type: String,
    default: () => crypto.randomBytes(32).toString('hex'),
    index: true,
  },
}, { timestamps: true });

quoteSchema.statics.EVENT_TYPES = EVENT_TYPES;
quoteSchema.statics.FULFILLMENT = FULFILLMENT;
quoteSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Quote', quoteSchema);
