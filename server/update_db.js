require('dotenv').config();
const mongoose = require('mongoose');
const Cookie = require('./models/Cookie');
const SiteContent = require('./models/SiteContent');

const newFlavors = [
  {
    name: 'Daun Chocolate Chips',
    description: 'Our signature cookie loaded with rich chocolate chips, baked to soft, gooey perfection.',
    tags: ['Signature', 'Chocolate'],
    featured: true,
    available: true,
    sortOrder: 1,
  },
  {
    name: 'Oreo Overload',
    description: 'Cookies and cream lovers rejoice! Packed with Oreo chunks and a creamy cookies-and-cream base.',
    tags: ['Fan Favorite'],
    featured: true,
    available: true,
    sortOrder: 2,
  },
  {
    name: 'Birthday Bite',
    description: 'A fun, colorful cookie loaded with sprinkles and white chocolate. Perfect for any celebration!',
    tags: ['Festive'],
    featured: true,
    available: true,
    sortOrder: 3,
  },
  {
    name: 'Red Velvet',
    description: 'Velvety red cocoa dough with white chocolate chips and a hint of cream cheese flavor.',
    tags: ['Premium'],
    featured: false,
    available: true,
    sortOrder: 4,
  },
  {
    name: 'Brookie',
    description: 'The best of both worlds! A half-brownie, half-cookie creation that is absolutely indulgent.',
    tags: ['Hybrid'],
    featured: false,
    available: true,
    sortOrder: 5,
  },
  {
    name: 'Brown Butter Salted Caramel',
    description: 'Rich brown butter dough with sweet caramel bits and a touch of sea salt.',
    tags: ['Sweet & Salty'],
    featured: false,
    available: true,
    sortOrder: 6,
  },
  {
    name: 'Ube Dream',
    description: 'A vibrant purple yam cookie with white chocolate chips, inspired by traditional Filipino flavors.',
    tags: ['Specialty'],
    featured: false,
    available: true,
    sortOrder: 7,
  },
  {
    name: 'Ube Matcha',
    description: 'A unique fusion of earthy matcha and sweet ube, creating a beautiful and delicious treat.',
    tags: ['Fusion'],
    featured: false,
    available: true,
    sortOrder: 8,
  },
  {
    name: 'Carrot Cookie',
    description: 'Everything you love about carrot cake in cookie form, topped with a cream cheese drizzle.',
    tags: ['Seasonal'],
    featured: false,
    available: true,
    sortOrder: 9,
  },
  {
    name: 'Banana Pudding',
    description: 'Inspired by the classic dessert, featuring real bananas and vanilla wafers.',
    tags: ['Comfort'],
    featured: false,
    available: true,
    sortOrder: 10,
  },
];

const newPreOrderContent = {
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
};

const update = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update Cookies
    for (const cookie of newFlavors) {
      await Cookie.findOneAndUpdate(
        { name: cookie.name },
        cookie,
        { upsert: true, new: true }
      );
    }
    console.log('Updated cookies collection');

    // Update Pre-Order Site Content
    await SiteContent.findOneAndUpdate(
      { page: 'preorder' },
      { content: newPreOrderContent },
      { upsert: true, new: true }
    );
    console.log('Updated pre-order site content');

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Update error:', err.message);
    process.exit(1);
  }
};

update();
