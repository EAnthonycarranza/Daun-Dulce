const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send admin notification when new order is placed
 */
const sendOrderNotification = async (order) => {
  try {
    const transporter = createTransporter();

    const flavorsText = order.flavors.join(', ') +
      (order.flavorOther ? ` (Other: ${order.flavorOther})` : '');

    const quantityText = order.quantity +
      (order.quantityOther ? ` (${order.quantityOther})` : '');

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Pre-Order #${order._id.toString().slice(-6).toUpperCase()} from ${order.customerName}`,
      html: `
        <div style="font-family: 'Lato', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #6B1520; color: #FFF8F0; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-family: 'Playfair Display', serif;">Daun Dulce</h1>
            <p style="margin: 5px 0 0;">New Pre-Order Received</p>
          </div>
          <div style="padding: 20px; background: #FFF8F0;">
            <h2 style="color: #6B1520;">Order #${order._id.toString().slice(-6).toUpperCase()}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${order.customerName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${order.contactEmail || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${order.contactPhone || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Quantity:</td><td style="padding: 8px;">${quantityText}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Flavors:</td><td style="padding: 8px;">${flavorsText}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Payment:</td><td style="padding: 8px;">${order.paymentMethod}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Pickup:</td><td style="padding: 8px;">${order.pickupDate}</td></tr>
              ${order.specialRequests ? `<tr><td style="padding: 8px; font-weight: bold;">Special Requests:</td><td style="padding: 8px;">${order.specialRequests}</td></tr>` : ''}
            </table>
          </div>
        </div>
      `,
    });

    console.log('Order notification email sent to admin');
  } catch (err) {
    console.error('Failed to send admin notification email:', err.message);
  }
};

/**
 * Send order confirmation email to the customer
 */
const sendCustomerConfirmationEmail = async (order) => {
  try {
    if (!order.contactEmail) {
      console.log('No customer email — skipping email confirmation');
      return;
    }

    const transporter = createTransporter();
    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const confirmUrl = `${siteUrl}/confirm-order/${order.confirmationToken}`;

    const flavorsText = order.flavors.join(', ') +
      (order.flavorOther ? ` (Other: ${order.flavorOther})` : '');

    const quantityText = order.quantity +
      (order.quantityOther ? ` (${order.quantityOther})` : '');

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: order.contactEmail,
      subject: 'Confirm Your Daun Dulce Pre-Order',
      html: `
        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0d5c8; border-radius: 8px; overflow: hidden;">
          <div style="background: #6B1520; color: #FFF8F0; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px;">Daun Dulce</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Please Confirm Your Pre-Order</p>
          </div>

          <div style="padding: 30px 24px; background: #FFF8F0;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hi <strong>${order.customerName}</strong>,
            </p>
            <p style="color: #6B1520; font-size: 18px; font-weight: bold; margin-bottom: 16px;">
              Order #${order._id.toString().slice(-6).toUpperCase()}
            </p>
            <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
              Thank you for your pre-order! Please confirm your order by clicking the button below:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="display: inline-block; background: #6B1520; color: #FFF8F0; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Confirm My Order
              </a>
            </div>

            <div style="background: #fff; border: 1px solid #e0d5c8; border-radius: 6px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #6B1520; margin: 0 0 12px; font-size: 16px;">Your Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 6px 0; color: #888;">Quantity:</td><td style="padding: 6px 0; color: #333;">${quantityText}</td></tr>
                <tr><td style="padding: 6px 0; color: #888;">Flavors:</td><td style="padding: 6px 0; color: #333;">${flavorsText}</td></tr>
                <tr><td style="padding: 6px 0; color: #888;">Payment:</td><td style="padding: 6px 0; color: #333;">${order.paymentMethod}</td></tr>
                <tr><td style="padding: 6px 0; color: #888;">Pickup:</td><td style="padding: 6px 0; color: #333;">${order.pickupDate}</td></tr>
                ${order.specialRequests ? `<tr><td style="padding: 6px 0; color: #888;">Notes:</td><td style="padding: 6px 0; color: #333;">${order.specialRequests}</td></tr>` : ''}
              </table>
            </div>

            <div style="background: #6B1520; color: #FFF8F0; padding: 12px 16px; border-radius: 6px; text-align: center; margin: 20px 0 16px;">
              <p style="margin: 0; font-size: 13px;">Save your Order # to track your order anytime at</p>
              <a href="${siteUrl}/track-order" style="color: #FFF8F0; font-weight: bold;">${siteUrl}/track-order</a>
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 20px; text-align: center;">
              If you didn't place this order, you can safely ignore this email.
            </p>
            <p style="color: #bbb; font-size: 11px; text-align: center; margin-top: 8px;">
              Can't click the button? Copy this link: ${confirmUrl}
            </p>
          </div>

          <div style="background: #6B1520; padding: 15px; text-align: center;">
            <p style="color: #FFF8F0; font-size: 12px; margin: 0; opacity: 0.8;">Daun Dulce - Handcrafted Cookies</p>
          </div>
        </div>
      `,
    });

    console.log(`Confirmation email sent to ${order.contactEmail}`);
    return true;
  } catch (err) {
    console.error('Failed to send customer confirmation email:', err.message);
    return false;
  }
};

/**
 * Send order status update email to customer
 */
const sendStatusUpdateEmail = async (order, newStatus) => {
  try {
    if (!order.contactEmail) return;

    const transporter = createTransporter();

    const statusMessages = {
      confirmed: {
        subject: 'Your Daun Dulce Order is Confirmed!',
        heading: 'Order Confirmed',
        message: 'Great news! Your pre-order has been confirmed. We\'re getting your cookies ready!',
        color: '#4A7C59',
      },
      completed: {
        subject: 'Your Daun Dulce Order is Ready!',
        heading: 'Order Complete',
        message: 'Your cookies are ready for pickup! Thank you for choosing Daun Dulce.',
        color: '#6B7280',
      },
      cancelled: {
        subject: 'Your Daun Dulce Order has been Cancelled',
        heading: 'Order Cancelled',
        message: 'Your pre-order has been cancelled. If you have any questions, please contact us.',
        color: '#C0392B',
      },
      pending: {
        subject: 'Your Daun Dulce Order Status Updated',
        heading: 'Order Updated',
        message: 'Your order status has been updated back to pending. We\'ll keep you posted!',
        color: '#D4A017',
      },
    };

    const info = statusMessages[newStatus];
    if (!info) return;

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: order.contactEmail,
      subject: info.subject,
      html: `
        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0d5c8; border-radius: 8px; overflow: hidden;">
          <div style="background: #6B1520; color: #FFF8F0; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px;">Daun Dulce</h1>
          </div>
          <div style="padding: 30px 24px; background: #FFF8F0; text-align: center;">
            <div style="display: inline-block; background: ${info.color}; color: white; padding: 8px 24px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">
              ${info.heading}
            </div>
            <p style="color: #333; font-size: 16px; margin: 16px 0 8px;">Hi <strong>${order.customerName}</strong>,</p>
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">${info.message}</p>
            <p style="color: #888; font-size: 13px;">Order #${order._id.toString().slice(-6).toUpperCase()}</p>
          </div>
          <div style="background: #6B1520; padding: 15px; text-align: center;">
            <p style="color: #FFF8F0; font-size: 12px; margin: 0; opacity: 0.8;">Daun Dulce - Handcrafted Cookies</p>
          </div>
        </div>
      `,
    });

    console.log(`Status update email (${newStatus}) sent to ${order.contactEmail}`);
  } catch (err) {
    console.error('Failed to send status update email:', err.message);
  }
};

/**
 * Send contact form message to admin
 */
const sendContactMessage = async (name, email, message) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Contact Form: Message from ${name}`,
      html: `
        <div style="font-family: 'Lato', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #6B1520; color: #FFF8F0; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-family: 'Playfair Display', serif;">Daun Dulce</h1>
            <p style="margin: 5px 0 0;">New Contact Message</p>
          </div>
          <div style="padding: 20px; background: #FFF8F0;">
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `,
    });

    console.log('Contact message email sent');
  } catch (err) {
    console.error('Failed to send contact email:', err.message);
  }
};

module.exports = {
  sendOrderNotification,
  sendCustomerConfirmationEmail,
  sendStatusUpdateEmail,
  sendContactMessage,
};
