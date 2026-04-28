const nodemailer = require('nodemailer');

/* ============================================================
   TRANSPORTER
   ============================================================ */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/* ============================================================
   BRAND THEME (kept inline — many email clients strip <style>)
   ============================================================ */
const BRAND = {
  maroon: '#6A1620',
  maroonDark: '#4F0F18',
  cream: '#F6E8D4',
  ivory: '#FFFCF6',
  gold: '#C9A876',
  goldDark: '#A2854F',
  text: '#2A1A1D',
  muted: '#7A6B6B',
  border: '#E5D7C2',
  success: '#4A7C59',
  danger: '#9C2A20',
};

const SITE_URL = () => process.env.SITE_URL || 'http://localhost:5173';
const MAPS_KEY = () => process.env.GOOGLE_MAPS_API_KEY || '';

/* ============================================================
   SHARED LAYOUT
   ============================================================ */

/**
 * Wraps inner HTML with the brand shell — header band, body card, footer.
 * `eyebrow` is the small uppercase label shown above the wordmark.
 */
const emailLayout = ({ eyebrow = '', headline = '', accentColor = BRAND.maroon, body = '' }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Daun Dulce</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.cream};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="max-width:640px;width:100%;background:${BRAND.ivory};border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(106,22,32,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${accentColor} 0%,${BRAND.maroonDark} 100%);padding:34px 24px 30px;text-align:center;">
              ${eyebrow ? `<div style="display:inline-block;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${BRAND.gold};font-weight:700;border:1px solid rgba(201,168,118,0.45);padding:5px 14px;border-radius:40px;margin-bottom:14px;">${eyebrow}</div>` : ''}
              <div style="font-family:Georgia,'Times New Roman',serif;color:${BRAND.cream};font-size:34px;letter-spacing:-0.01em;font-weight:400;line-height:1.1;">Daun Dulce</div>
              ${headline ? `<div style="margin-top:10px;color:rgba(246,232,212,0.88);font-size:14px;letter-spacing:0.02em;">${headline}</div>` : ''}
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr><td style="height:3px;background:linear-gradient(90deg,transparent,${BRAND.gold},transparent);"></td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:34px 32px 28px;">${body}</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${BRAND.maroonDark};padding:22px;text-align:center;">
              <div style="color:${BRAND.gold};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin-bottom:6px;">Handcrafted Cookies</div>
              <div style="color:${BRAND.cream};font-size:12px;opacity:0.85;">Daun Dulce · <a href="${SITE_URL()}" style="color:${BRAND.cream};text-decoration:underline;">${SITE_URL().replace(/^https?:\/\//, '')}</a></div>
            </td>
          </tr>
        </table>
        <div style="color:${BRAND.muted};font-size:11px;margin-top:14px;">
          You received this email because you placed an order or quote request with Daun Dulce.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/* ============================================================
   REUSABLE BLOCKS
   ============================================================ */

const greeting = (name) =>
  `<p style="margin:0 0 14px;font-size:16px;color:${BRAND.text};">Hi <strong>${escapeHtml(name)}</strong>,</p>`;

const paragraph = (html) =>
  `<p style="margin:0 0 16px;color:${BRAND.text};line-height:1.7;font-size:15px;">${html}</p>`;

const muted = (html) =>
  `<p style="margin:0 0 12px;color:${BRAND.muted};line-height:1.6;font-size:13px;">${html}</p>`;

const sectionHeading = (label) =>
  `<div style="font-family:Georgia,'Times New Roman',serif;color:${BRAND.maroon};font-size:18px;margin:24px 0 12px;font-weight:500;">${label}</div>`;

const button = (label, url, { color = BRAND.maroon, textColor = BRAND.cream, outline = false } = {}) => {
  const style = outline
    ? `background:transparent;color:${color};border:1.5px solid ${color};`
    : `background:${color};color:${textColor};border:1.5px solid ${color};`;
  return `<a href="${url}" style="${style}display:inline-block;padding:13px 30px;border-radius:4px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;margin:4px;">${label}</a>`;
};

const buttonRow = (buttons, align = 'center') =>
  `<div style="text-align:${align};margin:22px 0;">${buttons.join('')}</div>`;

const detailsTable = (rows) => {
  // rows: [['Label', 'Value'], ...] — values can include HTML
  const trs = rows
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => `
      <tr>
        <td style="padding:10px 0;color:${BRAND.muted};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;width:38%;vertical-align:top;border-bottom:1px solid ${BRAND.border};">${k}</td>
        <td style="padding:10px 0;color:${BRAND.text};font-size:14px;line-height:1.5;vertical-align:top;border-bottom:1px solid ${BRAND.border};">${v}</td>
      </tr>
    `).join('');
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border:1px solid ${BRAND.border};border-radius:8px;padding:8px 18px;">
      ${trs}
    </table>
  `;
};

const callout = (html, { tone = 'gold' } = {}) => {
  const color = tone === 'success' ? BRAND.success
    : tone === 'danger' ? BRAND.danger
    : BRAND.gold;
  return `
    <div style="background:#fff7e8;border-left:3px solid ${color};padding:14px 18px;border-radius:4px;margin:18px 0;">
      <div style="color:${BRAND.text};font-size:14px;line-height:1.6;">${html}</div>
    </div>
  `;
};

const statusBadge = (label, color) => `
  <div style="display:inline-block;background:${color};color:#fff;padding:8px 22px;border-radius:40px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:14px;">${label}</div>
`;

/**
 * Embed a delivery address as a Google Static Map image + open-in-maps link.
 * Falls back gracefully when no API key.
 */
const mapBlock = (address, lat, lng) => {
  if (!address) return '';
  const query = encodeURIComponent(address);
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  let mapImg = '';
  if (MAPS_KEY()) {
    const center = (Number.isFinite(lat) && Number.isFinite(lng)) ? `${lat},${lng}` : query;
    const marker = (Number.isFinite(lat) && Number.isFinite(lng)) ? `${lat},${lng}` : query;
    const src = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=15&size=600x240&scale=2&maptype=roadmap&markers=color:0x6A1620%7Csize:mid%7C${marker}&style=feature:poi%7Celement:labels%7Cvisibility:off&key=${MAPS_KEY()}`;
    mapImg = `
      <a href="${openUrl}" style="display:block;line-height:0;">
        <img src="${src}" alt="Delivery location map" width="600" style="display:block;width:100%;max-width:600px;height:auto;border-radius:8px;border:1px solid ${BRAND.border};" />
      </a>
    `;
  }

  return `
    <div style="margin:16px 0;">
      ${mapImg}
      <div style="margin-top:10px;background:#fff;border:1px solid ${BRAND.border};border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:11px;color:${BRAND.muted};letter-spacing:0.08em;text-transform:uppercase;font-weight:700;">Delivery Address</div>
          <div style="font-size:14px;color:${BRAND.text};margin-top:2px;">${escapeHtml(address)}</div>
        </div>
        <a href="${openUrl}" style="background:${BRAND.maroon};color:${BRAND.cream};padding:9px 16px;border-radius:4px;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;white-space:nowrap;">Open Map</a>
      </div>
    </div>
  `;
};

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* ============================================================
   QUOTE-SPECIFIC HELPERS
   ============================================================ */
const eventTypeLabel = (t, other) => {
  const map = {
    wedding: 'Wedding', corporate: 'Corporate Event', fundraiser: 'Fundraiser',
    birthday: 'Birthday', 'baby-shower': 'Baby Shower', holiday: 'Holiday',
    other: other ? `Other — ${other}` : 'Other',
  };
  return map[t] || t;
};
const money = (n) => (n == null ? '' : `$${Number(n).toFixed(2)}`);

const quoteEventRows = (quote) => [
  ['Event Type', eventTypeLabel(quote.eventType, quote.eventTypeOther)],
  ['Event Name', quote.eventName],
  ['Organization', quote.organization],
  ['Event Date', quote.eventDate ? `${quote.eventDate}${quote.dateFlexible ? ' <em style="color:'+BRAND.muted+';">(flexible)</em>' : ''}` : (quote.dateFlexible ? '<em style="color:'+BRAND.muted+';">Flexible</em>' : '')],
  ['Guest Count', quote.guestCount],
  ['Fulfillment', `${quote.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}`],
  ['Flavors', quote.flavors?.length ? quote.flavors.join(', ') : ''],
  ['Budget', quote.budgetRange],
];

/* ============================================================
   ORDER EMAILS
   ============================================================ */

/**
 * Admin notification — new order placed
 */
const sendOrderNotification = async (order) => {
  try {
    const transporter = createTransporter();
    const flavorsText = order.flavors.join(', ') + (order.flavorOther ? ` (Other: ${order.flavorOther})` : '');
    const quantityText = order.quantity + (order.quantityOther ? ` (${order.quantityOther})` : '');
    const orderId = order._id.toString().slice(-6).toUpperCase();

    const body = `
      ${statusBadge('New Pre-Order', BRAND.gold)}
      <div style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;margin:0 0 6px;font-weight:500;">${escapeHtml(order.customerName)}</div>
      <div style="color:${BRAND.muted};font-size:14px;margin-bottom:18px;">Order #${orderId}</div>
      ${detailsTable([
        ['Email', order.contactEmail ? `<a href="mailto:${order.contactEmail}" style="color:${BRAND.maroon};">${order.contactEmail}</a>` : ''],
        ['Phone', order.contactPhone ? `<a href="tel:${order.contactPhone}" style="color:${BRAND.maroon};">${order.contactPhone}</a>` : ''],
        ['Quantity', quantityText],
        ['Flavors', flavorsText],
        ['Payment', order.paymentMethod],
        ['Pickup', order.pickupDate],
        ['Notes', order.specialRequests],
      ])}
      ${muted(`Open the admin dashboard → Orders to update status.`)}
    `;

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Pre-Order #${orderId} from ${order.customerName}`,
      html: emailLayout({ eyebrow: 'New Order', headline: `Pre-order received · #${orderId}`, body }),
    });
    console.log('Order notification email sent to admin');
  } catch (err) {
    console.error('Failed to send admin notification email:', err.message);
  }
};

/**
 * Customer confirmation — please confirm your pre-order
 */
const sendCustomerConfirmationEmail = async (order) => {
  try {
    if (!order.contactEmail) return;
    const transporter = createTransporter();
    const confirmUrl = `${SITE_URL()}/confirm-order/${order.confirmationToken}`;
    const flavorsText = order.flavors.join(', ') + (order.flavorOther ? ` (Other: ${order.flavorOther})` : '');
    const quantityText = order.quantity + (order.quantityOther ? ` (${order.quantityOther})` : '');
    const orderId = order._id.toString().slice(-6).toUpperCase();

    const body = `
      ${greeting(order.customerName)}
      ${paragraph(`Thanks for your pre-order with Daun Dulce. Please confirm so we can lock it into the bake schedule.`)}

      ${buttonRow([button('Confirm My Order', confirmUrl)])}

      ${sectionHeading('Order Summary')}
      ${detailsTable([
        ['Order #', orderId],
        ['Quantity', quantityText],
        ['Flavors', flavorsText],
        ['Payment', order.paymentMethod],
        ['Pickup', order.pickupDate],
        ['Notes', order.specialRequests],
      ])}

      ${callout(`Save your order number — you can track it anytime at <a href="${SITE_URL()}/track-order" style="color:${BRAND.maroon};font-weight:700;">${SITE_URL().replace(/^https?:\/\//, '')}/track-order</a>.`)}

      ${muted(`If you didn't place this order, you can safely ignore this email.<br/>Trouble with the button? Paste this link: <a href="${confirmUrl}" style="color:${BRAND.maroon};">${confirmUrl}</a>`)}
    `;

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: order.contactEmail,
      subject: `Please confirm your Daun Dulce pre-order · #${orderId}`,
      html: emailLayout({ eyebrow: 'Confirm Pre-Order', headline: 'One last step to lock in your cookies', body }),
    });
    console.log(`Confirmation email sent to ${order.contactEmail}`);
    return true;
  } catch (err) {
    console.error('Failed to send customer confirmation email:', err.message);
    return false;
  }
};

/**
 * Customer status update — confirmed/completed/cancelled
 */
const sendStatusUpdateEmail = async (order, newStatus) => {
  try {
    if (!order.contactEmail) return;
    const transporter = createTransporter();
    const orderId = order._id.toString().slice(-6).toUpperCase();

    const messages = {
      confirmed: {
        subject: `Your Daun Dulce order is confirmed · #${orderId}`,
        eyebrow: 'Confirmed',
        headline: `We've got your order on the bake schedule`,
        badge: ['Order Confirmed', BRAND.success],
        body: `Great news, your pre-order is confirmed and we're getting your cookies ready.`,
      },
      completed: {
        subject: `Your Daun Dulce order is ready · #${orderId}`,
        eyebrow: 'Ready for Pickup',
        headline: `Your cookies are ready!`,
        badge: ['Order Complete', BRAND.muted],
        body: `Your cookies are baked and ready for pickup. Thank you for choosing Daun Dulce — we can't wait for you to taste them.`,
      },
      cancelled: {
        subject: `Your Daun Dulce order has been cancelled · #${orderId}`,
        eyebrow: 'Cancelled',
        headline: `Your order has been cancelled`,
        badge: ['Order Cancelled', BRAND.danger],
        body: `Your pre-order has been cancelled. If this was a mistake or you have questions, just reply to this email.`,
      },
      pending: {
        subject: `Your Daun Dulce order status updated · #${orderId}`,
        eyebrow: 'Updated',
        headline: `Order moved back to pending`,
        badge: ['Pending', BRAND.gold],
        body: `Your order status has been moved back to pending. We'll keep you posted.`,
      },
    };

    const info = messages[newStatus];
    if (!info) return;

    const body = `
      <div style="text-align:center;">${statusBadge(info.badge[0], info.badge[1])}</div>
      ${greeting(order.customerName)}
      ${paragraph(info.body)}
      <div style="text-align:center;color:${BRAND.muted};font-size:13px;margin-top:18px;">Order #${orderId}</div>
    `;

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: order.contactEmail,
      subject: info.subject,
      html: emailLayout({ eyebrow: info.eyebrow, headline: info.headline, body }),
    });
    console.log(`Status update email (${newStatus}) sent to ${order.contactEmail}`);
  } catch (err) {
    console.error('Failed to send status update email:', err.message);
  }
};

/**
 * Admin notification — new contact form message
 */
const sendContactMessage = async (name, email, message) => {
  try {
    const transporter = createTransporter();
    const body = `
      ${statusBadge('Contact Form', BRAND.gold)}
      <div style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:22px;margin:0 0 4px;font-weight:500;">${escapeHtml(name)}</div>
      <div style="color:${BRAND.muted};font-size:14px;margin-bottom:18px;">
        <a href="mailto:${escapeHtml(email)}" style="color:${BRAND.maroon};">${escapeHtml(email)}</a>
      </div>
      <div style="background:#fff;border:1px solid ${BRAND.border};border-radius:8px;padding:18px;color:${BRAND.text};font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>
      ${buttonRow([button('Reply', `mailto:${email}`)])}
    `;
    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Contact form: message from ${name}`,
      html: emailLayout({ eyebrow: 'New Message', headline: 'A customer just reached out', body }),
    });
    console.log('Contact message email sent');
  } catch (err) {
    console.error('Failed to send contact email:', err.message);
  }
};

/* ============================================================
   QUOTE EMAILS
   ============================================================ */

/** Admin notification — new quote request submitted */
const sendQuoteRequestNotification = async (quote) => {
  try {
    const transporter = createTransporter();
    const body = `
      ${statusBadge('New Quote Request', BRAND.gold)}
      <div style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;margin:0 0 4px;font-weight:500;">${escapeHtml(quote.customerName)}</div>
      <div style="color:${BRAND.muted};font-size:14px;margin-bottom:20px;">
        <a href="mailto:${escapeHtml(quote.contactEmail)}" style="color:${BRAND.maroon};">${escapeHtml(quote.contactEmail)}</a>
        &nbsp;·&nbsp;
        <a href="tel:${escapeHtml(quote.contactPhone)}" style="color:${BRAND.maroon};">${escapeHtml(quote.contactPhone)}</a>
      </div>

      ${sectionHeading('Event Details')}
      ${detailsTable(quoteEventRows(quote))}

      ${quote.fulfillment === 'delivery' && quote.deliveryAddress
        ? mapBlock(quote.deliveryAddress, quote.deliveryLat, quote.deliveryLng)
        : ''}

      ${quote.flavorNotes ? `${sectionHeading('Flavor Notes')}${paragraph(escapeHtml(quote.flavorNotes))}` : ''}
      ${quote.details ? `${sectionHeading('Additional Details')}<div style="white-space:pre-wrap;color:${BRAND.text};line-height:1.7;font-size:15px;">${escapeHtml(quote.details)}</div>` : ''}
      ${quote.referral ? muted(`Heard about us via: <strong>${escapeHtml(quote.referral)}</strong>`) : ''}

      ${buttonRow([button('Open in Admin', `${SITE_URL()}/admin/dashboard`)])}
    `;

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Quote Request — ${eventTypeLabel(quote.eventType, quote.eventTypeOther)} · ${quote.customerName}`,
      html: emailLayout({ eyebrow: 'Quote Request', headline: `${eventTypeLabel(quote.eventType, quote.eventTypeOther)} · ${quote.guestCount} guests`, body }),
    });
    console.log('Quote request notification sent to admin');
  } catch (err) {
    console.error('Failed to send quote request notification:', err.message);
  }
};

/** Customer receipt — we got your request */
const sendQuoteReceivedEmail = async (quote) => {
  try {
    if (!quote.contactEmail) return;
    const transporter = createTransporter();
    const body = `
      ${greeting(quote.customerName)}
      ${paragraph(`Thank you for reaching out about your <strong>${eventTypeLabel(quote.eventType, quote.eventTypeOther).toLowerCase()}</strong>. Your request is in our queue and we'll send a custom quote within <strong>1–2 business days</strong>.`)}

      ${sectionHeading('Your Request')}
      ${detailsTable(quoteEventRows(quote))}

      ${quote.fulfillment === 'delivery' && quote.deliveryAddress
        ? mapBlock(quote.deliveryAddress, quote.deliveryLat, quote.deliveryLng)
        : ''}

      ${callout(`Questions in the meantime? Just reply to this email — we'll get back to you fast.`)}
    `;

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: quote.contactEmail,
      subject: `We received your Daun Dulce quote request`,
      html: emailLayout({ eyebrow: 'Quote Request', headline: `Thanks — we'll be in touch soon`, body }),
    });
    console.log(`Quote-received email sent to ${quote.contactEmail}`);
    return true;
  } catch (err) {
    console.error('Failed to send quote-received email:', err.message);
    return false;
  }
};

/** Admin → Customer: the actual quote with accept/decline buttons */
const sendQuoteResponseEmail = async (quote) => {
  try {
    if (!quote.contactEmail || !quote.quote?.total) return false;
    const transporter = createTransporter();
    const acceptUrl = `${SITE_URL()}/quote-response/${quote.responseToken}?action=accept`;
    const declineUrl = `${SITE_URL()}/quote-response/${quote.responseToken}?action=decline`;
    const viewUrl = `${SITE_URL()}/quote-response/${quote.responseToken}`;
    const q = quote.quote;

    let lineItems = '';
    if (q.isItemized && q.items?.length) {
      lineItems = q.items.map((item) => `
        <tr>
          <td style="padding:12px 0;color:${BRAND.text};font-size:14px;border-bottom:1px solid ${BRAND.border};">
            <div style="font-weight:600;">${escapeHtml(item.name)}</div>
            <div style="color:${BRAND.muted};font-size:12px;margin-top:2px;">${item.quantity} × ${escapeHtml(item.unitLabel || 'unit')} @ ${money(item.pricePerUnit)}</div>
          </td>
          <td style="padding:12px 0;color:${BRAND.text};font-size:14px;text-align:right;font-weight:600;border-bottom:1px solid ${BRAND.border};">${money(item.quantity * item.pricePerUnit)}</td>
        </tr>
      `).join('');
    } else if (q.items?.[0]) {
      const it = q.items[0];
      lineItems = `
        <tr>
          <td style="padding:12px 0;color:${BRAND.text};font-size:14px;border-bottom:1px solid ${BRAND.border};">
            <div style="font-weight:600;">${escapeHtml(it.name || 'Cookies')}</div>
            <div style="color:${BRAND.muted};font-size:12px;margin-top:2px;">${it.quantity} × ${escapeHtml(it.unitLabel || 'unit')} @ ${money(it.pricePerUnit)}</div>
          </td>
          <td style="padding:12px 0;color:${BRAND.text};font-size:14px;text-align:right;font-weight:600;border-bottom:1px solid ${BRAND.border};">${money(it.quantity * it.pricePerUnit)}</td>
        </tr>
      `;
    }

    const pricingTable = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border:1px solid ${BRAND.border};border-radius:8px;padding:6px 20px;">
        ${lineItems}
        <tr>
          <td style="padding:10px 0;color:${BRAND.muted};font-size:13px;">Subtotal</td>
          <td style="padding:10px 0;color:${BRAND.text};font-size:13px;text-align:right;">${money(q.subtotal)}</td>
        </tr>
        ${q.fees ? `<tr>
          <td style="padding:6px 0;color:${BRAND.muted};font-size:13px;">Fees</td>
          <td style="padding:6px 0;color:${BRAND.text};font-size:13px;text-align:right;">${money(q.fees)}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:14px 0 8px;color:${BRAND.maroon};font-family:Georgia,serif;font-size:18px;font-weight:500;border-top:2px solid ${BRAND.maroon};">Total</td>
          <td style="padding:14px 0 8px;color:${BRAND.maroon};font-family:Georgia,serif;font-size:22px;font-weight:500;text-align:right;border-top:2px solid ${BRAND.maroon};">${money(q.total)}</td>
        </tr>
      </table>
    `;

    const body = `
      ${greeting(quote.customerName)}
      ${paragraph(`Here's your custom quote for your <strong>${eventTypeLabel(quote.eventType, quote.eventTypeOther).toLowerCase()}</strong>. Review the details below and let us know how you'd like to proceed.`)}

      ${sectionHeading('Pricing')}
      ${pricingTable}
      ${q.validUntil ? muted(`Valid until <strong>${escapeHtml(q.validUntil)}</strong>`) : ''}

      ${q.notes ? callout(`<strong style="color:${BRAND.maroon};">Notes from the kitchen</strong><br/><span style="white-space:pre-wrap;">${escapeHtml(q.notes)}</span>`) : ''}

      ${sectionHeading('Event Summary')}
      ${detailsTable(quoteEventRows(quote))}

      ${quote.fulfillment === 'delivery' && quote.deliveryAddress
        ? mapBlock(quote.deliveryAddress, quote.deliveryLat, quote.deliveryLng)
        : ''}

      ${buttonRow([
        button('Accept Quote', acceptUrl, { color: BRAND.success }),
        button('Decline', declineUrl, { color: BRAND.maroon, outline: true }),
      ])}

      ${muted(`Or <a href="${viewUrl}" style="color:${BRAND.maroon};font-weight:700;">view this quote online</a>. Have questions? Just reply to this email.`)}
    `;

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: quote.contactEmail,
      subject: `Your Daun Dulce quote · ${eventTypeLabel(quote.eventType, quote.eventTypeOther)} · ${money(q.total)}`,
      html: emailLayout({ eyebrow: 'Custom Quote', headline: `Your ${eventTypeLabel(quote.eventType, quote.eventTypeOther).toLowerCase()} quote is ready`, body }),
    });
    console.log(`Quote response email sent to ${quote.contactEmail}`);
    return true;
  } catch (err) {
    console.error('Failed to send quote response email:', err.message);
    return false;
  }
};

/** Customer → Admin: customer accepted/declined */
const sendQuoteAcceptedNotification = async (quote, action) => {
  try {
    const transporter = createTransporter();
    const accepted = action === 'accept';
    const accentColor = accepted ? BRAND.success : BRAND.danger;
    const eyebrow = accepted ? 'Quote Accepted' : 'Quote Declined';

    const body = `
      <div style="text-align:center;">${statusBadge(accepted ? 'Accepted' : 'Declined', accentColor)}</div>
      <div style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:22px;margin:6px 0 4px;font-weight:500;text-align:center;">${escapeHtml(quote.customerName)}</div>
      <div style="text-align:center;color:${BRAND.muted};font-size:14px;margin-bottom:22px;">${escapeHtml(quote.contactEmail)} · ${escapeHtml(quote.contactPhone)}</div>

      ${detailsTable([
        ['Event', eventTypeLabel(quote.eventType, quote.eventTypeOther)],
        ['Event Date', quote.eventDate || (quote.dateFlexible ? 'Flexible' : '')],
        ['Guests', quote.guestCount],
        ['Total', accepted && quote.quote?.total ? money(quote.quote.total) : ''],
      ])}

      ${quote.fulfillment === 'delivery' && quote.deliveryAddress && accepted
        ? mapBlock(quote.deliveryAddress, quote.deliveryLat, quote.deliveryLng)
        : ''}

      ${muted(accepted
        ? `Open the dashboard to confirm details, schedule, and payment.`
        : `Open the dashboard if you'd like to follow up with an alternative.`)}
      ${buttonRow([button('Open in Admin', `${SITE_URL()}/admin/dashboard`)])}
    `;

    await transporter.sendMail({
      from: `"Daun Dulce" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `${accepted ? 'Accepted' : 'Declined'}: Quote — ${quote.customerName}`,
      html: emailLayout({ eyebrow, headline: `${quote.customerName} ${accepted ? 'accepted' : 'declined'} their quote`, accentColor, body }),
    });
    console.log(`Quote ${action} notification sent to admin`);
  } catch (err) {
    console.error('Failed to send quote response notification:', err.message);
  }
};

module.exports = {
  sendOrderNotification,
  sendCustomerConfirmationEmail,
  sendStatusUpdateEmail,
  sendContactMessage,
  sendQuoteRequestNotification,
  sendQuoteReceivedEmail,
  sendQuoteResponseEmail,
  sendQuoteAcceptedNotification,
};
