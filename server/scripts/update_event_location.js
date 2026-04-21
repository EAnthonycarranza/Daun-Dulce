require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

const updateEventLocation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await Event.findOneAndUpdate(
      { title: 'Sweet Treats Night' },
      { 
        location: 'Tacara at Crosswinds',
        googleMapsLink: 'https://maps.google.com/?q=Tacara+at+Crosswinds,+11411+Crosswinds+Way,+San+Antonio,+TX+78233'
      },
      { new: true }
    );

    if (result) {
      console.log('Event updated successfully:');
      console.log(JSON.stringify(result, null, 2));
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

updateEventLocation();
