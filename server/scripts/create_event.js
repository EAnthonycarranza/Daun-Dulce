require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const Event = require('../models/Event');

const createEvent = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const eventDetails = {
      title: 'Sweet Treats Night',
      description: 'Hosted by @daundulce 🍪 Freshly baked cookies, Made with love ❤️ LIMITED QUANTITIES 👀 Time: 6 PM - 9 PM. Come satisfy your sweet tooth! 😊',
      date: new Date('2026-04-23T18:00:00'),
      location: 'In Front of the Leasing Office',
      link: 'https://www.instagram.com/daundulce', // Assumed host link
      image: null, // Placeholder since the file isn't uploaded yet
    };

    const newEvent = await Event.create(eventDetails);
    console.log('Event created successfully:');
    console.log(JSON.stringify(newEvent, null, 2));

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating event:', err.message);
    process.exit(1);
  }
};

createEvent();
