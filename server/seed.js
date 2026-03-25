require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Cookie = require('./models/Cookie');

const defaultCookies = [
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
    name: 'Celebration Bite',
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
    name: 'Salted Caramel',
    description: 'Sweet meets salty in this buttery caramel cookie topped with a sprinkle of sea salt.',
    tags: ['Sweet & Salty'],
    featured: false,
    available: true,
    sortOrder: 5,
  },
  {
    name: 'Double Chocolate',
    description: 'For the ultimate chocolate lover -- rich chocolate dough with dark and milk chocolate chunks.',
    tags: ['Chocolate'],
    featured: false,
    available: true,
    sortOrder: 6,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Seed admin
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log(`Admin user "${username}" already exists. Updating password...`);
      existingAdmin.password = password;
      await existingAdmin.save();
    } else {
      await Admin.create({ username, password });
      console.log(`Admin user "${username}" created successfully.`);
    }

    // Seed cookies (only if none exist)
    const cookieCount = await Cookie.countDocuments();
    if (cookieCount === 0) {
      await Cookie.insertMany(defaultCookies);
      console.log(`Seeded ${defaultCookies.length} cookies.`);
    } else {
      console.log(`${cookieCount} cookies already exist. Skipping cookie seed.`);
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();
