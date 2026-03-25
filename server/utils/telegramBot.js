/**
 * Telegram Bot for Daun Dulce order confirmations.
 * 100% free, unlimited messages, via the Telegram Bot HTTP API.
 *
 * Flow:
 *  1. Customer submits order → gets a link: t.me/BotName?start=ORDER_TOKEN
 *  2. Customer opens Telegram, presses Start
 *  3. Bot receives /start with the token, looks up the order
 *  4. Bot sends a confirmation message with a clickable confirm link
 *  5. Admin status changes also push updates to the customer via Telegram
 *
 * Setup: Create a bot via @BotFather on Telegram, get the token, add to .env
 */

const Order = require('../models/Order');

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = () => `https://api.telegram.org/bot${BOT_TOKEN()}`;

let pollingActive = false;
let pollingOffset = 0;
let conflictCount = 0;
const MAX_CONFLICTS = 5;

/**
 * Call the Telegram Bot API
 */
const telegramApi = async (method, body = {}) => {
  const token = BOT_TOKEN();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error(`Telegram API error (${method}):`, data.description);
    }
    return data;
  } catch (err) {
    console.error(`Telegram API call failed (${method}):`, err.message);
    return null;
  }
};

/**
 * Send a message to a specific Telegram chat
 */
const sendMessage = async (chatId, text, options = {}) => {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...options,
  });
};

/**
 * Handle /start command from a customer
 * When user clicks t.me/BotName?start=ORDER_TOKEN, Telegram sends /start ORDER_TOKEN
 */
const handleStartCommand = async (chatId, args, fromUser) => {
  if (!args) {
    // User just opened the bot without an order token
    await sendMessage(chatId,
      `🍪 <b>Welcome to Daun Dulce!</b>\n\n` +
      `I send order confirmations and status updates.\n\n` +
      `To get started, place a pre-order on our website and tap the "Confirm via Telegram" button!`
    );
    return;
  }

  const token = args.trim();

  try {
    const order = await Order.findOne({ confirmationToken: token });

    if (!order) {
      await sendMessage(chatId,
        `❌ Sorry, this confirmation link is invalid or expired.\n\n` +
        `Please contact us if you need help!`
      );
      return;
    }

    // Save the Telegram chat ID to the order for future updates
    order.telegramChatId = chatId;

    if (order.emailConfirmed) {
      // Already confirmed
      await sendMessage(chatId,
        `✅ <b>Already Confirmed!</b>\n\n` +
        `Your order #${order._id.toString().slice(-6).toUpperCase()} is already confirmed. No further action needed!\n\n` +
        `📦 <b>Status:</b> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\n` +
        `🍪 <b>Quantity:</b> ${order.quantity}${order.quantityOther ? ` (${order.quantityOther})` : ''}\n` +
        `📅 <b>Pickup:</b> ${order.pickupDate}\n\n` +
        `I'll send you updates when your order status changes!`
      );
      await order.save();
      return;
    }

    // Confirm the order
    order.emailConfirmed = true;
    await order.save();

    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const flavorsText = order.flavors.join(', ') +
      (order.flavorOther ? ` (Other: ${order.flavorOther})` : '');

    await sendMessage(chatId,
      `✅ <b>Order Confirmed!</b>\n\n` +
      `Thank you, ${order.customerName}! Your pre-order has been confirmed.\n\n` +
      `📋 <b>Order #${order._id.toString().slice(-6).toUpperCase()}</b>\n` +
      `🍪 <b>Quantity:</b> ${order.quantity}${order.quantityOther ? ` (${order.quantityOther})` : ''}\n` +
      `🎨 <b>Flavors:</b> ${flavorsText}\n` +
      `💳 <b>Payment:</b> ${order.paymentMethod}\n` +
      `📅 <b>Pickup:</b> ${order.pickupDate}\n` +
      (order.specialRequests ? `📝 <b>Notes:</b> ${order.specialRequests}\n` : '') +
      `\nI'll notify you here when your order status changes! 🔔`
    );

    console.log(`Telegram: Order ${order._id} confirmed by chat ${chatId}`);
  } catch (err) {
    console.error('Telegram handleStartCommand error:', err);
    await sendMessage(chatId, `⚠️ Something went wrong. Please try again or contact us.`);
  }
};

/**
 * Process incoming Telegram updates (messages)
 */
const processUpdate = async (update) => {
  if (!update.message || !update.message.text) return;

  const chatId = update.message.chat.id;
  const text = update.message.text;
  const fromUser = update.message.from;

  if (text.startsWith('/start')) {
    const args = text.replace('/start', '').trim();
    await handleStartCommand(chatId, args || null, fromUser);
  } else if (text === '/help') {
    await sendMessage(chatId,
      `🍪 <b>Daun Dulce Bot</b>\n\n` +
      `I help you confirm pre-orders and get status updates right here in Telegram!\n\n` +
      `<b>How to use:</b>\n` +
      `1. Place a pre-order on our website\n` +
      `2. Tap "Confirm via Telegram" on the success page\n` +
      `3. I'll confirm your order and send updates here!\n\n` +
      `<b>Commands:</b>\n` +
      `/start — Start or confirm an order\n` +
      `/help — Show this help message`
    );
  } else {
    await sendMessage(chatId,
      `Thanks for your message! 🍪\n\n` +
      `I'm the Daun Dulce order bot. For questions about your order, please contact us through our website or social media.\n\n` +
      `Type /help for more info.`
    );
  }
};

/**
 * Poll for new messages from Telegram (long polling)
 */
const pollUpdates = async () => {
  if (!BOT_TOKEN()) return;

  try {
    const data = await telegramApi('getUpdates', {
      offset: pollingOffset,
      timeout: 30,
      allowed_updates: ['message'],
    });

    if (data && data.ok && data.result && data.result.length > 0) {
      conflictCount = 0; // reset on success
      for (const update of data.result) {
        pollingOffset = update.update_id + 1;
        await processUpdate(update);
      }
    } else if (data && !data.ok && data.description?.includes('Conflict')) {
      conflictCount++;
      if (conflictCount >= MAX_CONFLICTS) {
        console.error('Telegram bot: Too many conflicts — another instance is running. Stopping polling.');
        pollingActive = false;
        return;
      }
      // Wait longer before retrying on conflict
      if (pollingActive) {
        setTimeout(pollUpdates, 5000);
        return;
      }
    } else {
      conflictCount = 0;
    }
  } catch (err) {
    console.error('Telegram polling error:', err.message);
  }

  // Continue polling
  if (pollingActive) {
    setTimeout(pollUpdates, 1000);
  }
};

/**
 * Start the Telegram bot polling
 */
const startBot = async () => {
  if (!BOT_TOKEN()) {
    console.log('Telegram bot: No TELEGRAM_BOT_TOKEN in .env — bot disabled');
    return;
  }

  if (pollingActive) return;
  pollingActive = true;
  conflictCount = 0;

  console.log('Telegram bot: Starting polling...');

  // Clear any pending getUpdates to avoid conflict with stale sessions
  await telegramApi('getUpdates', { offset: -1, timeout: 0 });

  // Get bot info
  const info = await telegramApi('getMe');
  if (info && info.ok) {
    console.log(`Telegram bot: @${info.result.username} is online!`);
  }

  pollUpdates();
};

/**
 * Stop the bot
 */
const stopBot = () => {
  pollingActive = false;
  console.log('Telegram bot: Stopped');
};

/**
 * Send an order status update to a customer via Telegram
 */
const sendTelegramStatusUpdate = async (order, newStatus) => {
  if (!order.telegramChatId || !BOT_TOKEN()) return false;

  const statusEmojis = {
    pending: '🕐',
    confirmed: '✅',
    completed: '🎉',
    cancelled: '❌',
  };

  const statusMessages = {
    pending: 'Your order has been updated back to pending. We\'ll keep you posted!',
    confirmed: 'Great news! Your pre-order has been confirmed. We\'re getting your cookies ready!',
    completed: 'Your cookies are ready for pickup! Thank you for choosing Daun Dulce! 🍪',
    cancelled: 'Your pre-order has been cancelled. If you have questions, please contact us.',
  };

  const emoji = statusEmojis[newStatus] || '📋';
  const message = statusMessages[newStatus] || 'Your order status has been updated.';

  try {
    await sendMessage(order.telegramChatId,
      `${emoji} <b>Order Update</b>\n\n` +
      `Hi ${order.customerName}!\n\n` +
      `${message}\n\n` +
      `📋 Order #${order._id.toString().slice(-6).toUpperCase()}\n` +
      `📦 Status: <b>${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</b>`
    );
    console.log(`Telegram: Status update (${newStatus}) sent to chat ${order.telegramChatId}`);
    return true;
  } catch (err) {
    console.error('Telegram status update error:', err.message);
    return false;
  }
};

/**
 * Send a confirmation reminder via Telegram (admin resend)
 */
const sendTelegramConfirmationReminder = async (order) => {
  if (!order.telegramChatId || !BOT_TOKEN()) return false;

  const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
  const confirmUrl = `${siteUrl}/confirm-order/${order.confirmationToken}`;

  try {
    await sendMessage(order.telegramChatId,
      `🔔 <b>Reminder: Confirm Your Order</b>\n\n` +
      `Hi ${order.customerName}! Please confirm your Daun Dulce pre-order:\n\n` +
      `👉 <a href="${confirmUrl}">Confirm My Order</a>\n\n` +
      `📋 Order #${order._id.toString().slice(-6).toUpperCase()}`
    );
    return true;
  } catch (err) {
    console.error('Telegram reminder error:', err.message);
    return false;
  }
};

module.exports = {
  startBot,
  stopBot,
  sendTelegramStatusUpdate,
  sendTelegramConfirmationReminder,
};
