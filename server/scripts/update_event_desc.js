require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

const updateEventDescription = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const newDescription = `Hosted by @daundulce 🍪
Freshly baked cookies, made with love ❤️

LIMITED QUANTITIES 👀
In front of the leasing office.

Come satisfy your sweet tooth! 😊`;

    const result = await Event.findOneAndUpdate(
      { title: 'Sweet Treats Night' },
      { description: newDescription },
      { new: true }
    );

    if (result) {
      console.log('Event updated successfully:');
      console.log(result.description);
    } else {
      console.log('Event not found');
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating event:', err.message);
    process.exit(1);
  }
};

updateEventDescription();
