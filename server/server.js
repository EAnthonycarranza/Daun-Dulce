const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: __dirname + '/.env' });

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const cookieRoutes = require('./routes/cookies');
const eventRoutes = require('./routes/events');
const customerRoutes = require('./routes/customers');
const siteContentRoutes = require('./routes/siteContent');
const quoteRoutes = require('./routes/quotes');
const { startBot: startTelegramBot } = require('./utils/telegramBot');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Legacy: serve old local uploads (new images go to Google Cloud Storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting for public POST routes
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', publicLimiter, contactRoutes);
app.use('/api/cookies', cookieRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/quotes', quoteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Catch-all: serve React for any non-API route (SPA routing)
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start Telegram bot polling
  startTelegramBot();
});
