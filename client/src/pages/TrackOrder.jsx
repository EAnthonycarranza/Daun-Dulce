import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import styles from './TrackOrder.module.css';

const STATUS_INFO = {
  pending: { label: 'Pending', color: '#D4A017', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: '#4A7C59', icon: '✅' },
  completed: { label: 'Completed', color: '#6B7280', icon: '🎉' },
  cancelled: { label: 'Cancelled', color: '#C0392B', icon: '❌' },
};

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setError('');
    setOrder(null);

    const cleaned = orderNumber.replace(/^#/, '').trim();
    if (!cleaned) {
      setError('Please enter your Order #.');
      return;
    }
    if (!/^[a-f0-9]{6}$/i.test(cleaned)) {
      setError('Order # must be a 6-character code (e.g., A3F2B1).');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get(`/orders/track/${cleaned}`);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not find your order. Please check the Order # and try again.');
    }
    setLoading(false);
  };

  const statusInfo = order ? STATUS_INFO[order.status] || STATUS_INFO.pending : null;

  return (
    <div className={styles.trackPage}>
      <section className={styles.header}>
        <h1>Track Your Order</h1>
        <p>Enter your Order # to check the status of your pre-order</p>
      </section>

      <section className={styles.content}>
        <div className={styles.searchCard}>
          <form onSubmit={handleTrack} className={styles.searchForm}>
            <div className={styles.inputGroup}>
              <span className={styles.hashPrefix}>#</span>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. A3F2B1"
                maxLength={6}
                className={styles.searchInput}
                autoFocus
              />
            </div>
            <button type="submit" className={styles.searchBtn} disabled={loading}>
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>

          {error && <p className={styles.error}>{error}</p>}

          <p className={styles.hint}>
            Your Order # was shown after submitting your pre-order and included in your confirmation email.
          </p>
        </div>

        {order && (
          <div className={styles.resultCard}>
            <div className={styles.statusBanner} style={{ background: statusInfo.color }}>
              <span className={styles.statusIcon}>{statusInfo.icon}</span>
              <span className={styles.statusLabel}>{statusInfo.label}</span>
            </div>

            <div className={styles.orderDetails}>
              <h2 className={styles.orderTitle}>
                Order #{order._id?.slice(-6).toUpperCase()}
              </h2>
              <p className={styles.orderName}>{order.customerName}</p>

              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Quantity</span>
                  <span className={styles.detailValue}>
                    {order.quantity}{order.quantityOther ? ` (${order.quantityOther})` : ''}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Flavors</span>
                  <span className={styles.detailValue}>
                    {order.flavors?.join(', ')}{order.flavorOther ? ` (Other: ${order.flavorOther})` : ''}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Payment</span>
                  <span className={styles.detailValue}>{order.paymentMethod}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Pickup Date</span>
                  <span className={styles.detailValue}>{order.pickupDate}</span>
                </div>
                {order.specialRequests && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Special Requests</span>
                    <span className={styles.detailValue}>{order.specialRequests}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Ordered</span>
                  <span className={styles.detailValue}>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className={styles.confirmationStatus}>
                {order.emailConfirmed ? (
                  <span className={styles.confirmedBadge}>
                    Order Confirmed {order.telegramChatId ? '(via Telegram)' : '(via Email)'}
                  </span>
                ) : (
                  <span className={styles.unconfirmedBadge}>
                    Awaiting Confirmation — please check your email
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={styles.accountCta}>
          <p>Want easier order tracking?</p>
          <Link to="/register" className={styles.ctaLink}>Create an account</Link>
          <span> or </span>
          <Link to="/login" className={styles.ctaLink}>sign in</Link>
          <span> to view all your orders in one place.</span>
        </div>
      </section>
    </div>
  );
};

export default TrackOrder;
