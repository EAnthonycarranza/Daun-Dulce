require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

const seedEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing events for a clean slate if desired, 
    // but here we'll just add more.
    
    const events = [];
    const titles = [
      'Cookie Workshop', 'Late Night Bites', 'Morning Pastries', 
      'Sweet Celebration', 'Chocolate Fest', 'Sprinkle Party', 
      'Vanilla Dreams', 'Caramel Crunch', 'Nutty Delights', 'Fruity Pop'
    ];

    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setDate(date.getDate() + (i + 1)); // Set future dates
      
      events.push({
        title: `${titles[i % titles.length]} #${i + 1}`,
        description: `Join us for a delicious ${titles[i % titles.length].toLowerCase()} session!`,
        date: date,
        location: `Location ${i + 1}`,
        time: '5:00 PM - 8:00 PM',
        link: 'https://example.com'
      });
    }

    await Event.insertMany(events);
    console.log('12 events seeded successfully');

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding events:', err.message);
    process.exit(1);
  }
};

seedEvents();
