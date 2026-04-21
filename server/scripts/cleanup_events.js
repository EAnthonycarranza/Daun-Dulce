require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

const cleanupEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Remove all events except the one with the specific title
    const result = await Event.deleteMany({ title: { $ne: 'Sweet Treats Night' } });
    console.log(`Deleted ${result.deletedCount} events.`);
    
    const remaining = await Event.find({});
    console.log('Remaining events:');
    console.log(JSON.stringify(remaining, null, 2));

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning up events:', err.message);
    process.exit(1);
  }
};

cleanupEvents();
