import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaCookieBite } from 'react-icons/fa';
import api from '../services/api';
import styles from './QuoteResponse.module.css';

const EVENT_LABELS = {
  wedding: 'Wedding',
  corporate: 'Corporate Event',
  fundraiser: 'Fundraiser',
  birthday: 'Birthday',
  'baby-shower': 'Baby Shower',
  holiday: 'Holiday',
  other: 'Event',
};

const money = (n) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '—');

const QuoteResponse = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const prefillAction = searchParams.get('action');

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [responded, setResponded] = useState(null); // 'accepted' | 'declined'

  useEffect(() => {
    api.get(`/quotes/respond/${token}`)
      .then((res) => {
        setQuote(res.data);
        if (res.data.status === 'accepted' || res.data.status === 'declined') {
          setResponded(res.data.status);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Quote not found.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleResponse = async (action) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/quotes/respond/${token}`, { action });
      setResponded(res.data.status);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p className={styles.loading}>Loading your quote…</p>
        </div>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1>Quote Not Found</h1>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (responded) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={`${styles.icon} ${responded === 'accepted' ? styles.iconAccept : styles.iconDecline}`}>
              {responded === 'accepted' ? <FaCheckCircle /> : <FaTimesCircle />}
            </div>
            <h1>
              {responded === 'accepted' ? 'Quote Accepted!' : 'Quote Declined'}
            </h1>
            <p className={styles.lead}>
              {responded === 'accepted'
                ? `Wonderful, ${quote.customerName.split(' ')[0]}! We'll be in touch within 1 business day to confirm details, payment, and next steps.`
                : 'Thank you for letting us know. If you change your mind or want to discuss alternatives, just reply to our email.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const q = quote.quote || {};
  const canRespond = quote.status === 'quoted';

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Your Custom Quote</span>
          <h1>{EVENT_LABELS[quote.eventType] || 'Event'} Quote</h1>
          <p>Review the details below and let us know how you'd like to proceed.</p>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.summaryHead}>
            <div>
              <h2>Hello, {quote.customerName.split(' ')[0]}</h2>
              {quote.eventName && <p className={styles.eventName}>{quote.eventName}</p>}
            </div>
            <FaCookieBite className={styles.cookieIcon} />
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detail}>
              <span>Event Type</span>
              <strong>{quote.eventTypeOther || EVENT_LABELS[quote.eventType]}</strong>
            </div>
            {quote.eventDate && (
              <div className={styles.detail}>
                <span>Event Date</span>
                <strong>{quote.eventDate}</strong>
              </div>
            )}
            <div className={styles.detail}>
              <span>Guest Count</span>
              <strong>{quote.guestCount}</strong>
            </div>
            <div className={styles.detail}>
              <span>Fulfillment</span>
              <strong style={{ textTransform: 'capitalize' }}>{quote.fulfillment}</strong>
            </div>
            {quote.flavors && quote.flavors.length > 0 && (
              <div className={`${styles.detail} ${styles.detailFull}`}>
                <span>Flavors</span>
                <strong>{quote.flavors.join(', ')}</strong>
              </div>
            )}
          </div>

          {q.items?.length > 0 ? (
            <div className={styles.pricingBox}>
              <h3>Pricing</h3>
              {q.isItemized ? (
                q.items.map((item, idx) => (
                  <div key={idx} className={styles.pricingRow}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>{item.name}</span>
                      <span style={{ fontSize: '0.85rem' }}>{item.quantity} × {item.unitLabel || 'cookie'} @ {money(item.pricePerUnit)}</span>
                    </div>
                    <strong style={{ alignSelf: 'flex-end' }}>{money(item.quantity * item.pricePerUnit)}</strong>
                  </div>
                ))
              ) : (
                <div className={styles.pricingRow}>
                  <span>{q.items[0].quantity} × {q.items[0].unitLabel || 'cookie'} @ {money(q.items[0].pricePerUnit)} each</span>
                  <strong>{money(q.items[0].quantity * q.items[0].pricePerUnit)}</strong>
                </div>
              )}

              <div className={styles.pricingRow} style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '12px', marginTop: '4px' }}>
                <span>Subtotal</span>
                <strong>{money(q.subtotal)}</strong>
              </div>
              {q.fees > 0 && (
                <div className={styles.pricingRow}>
                  <span>Fees</span>
                  <strong>{money(q.fees)}</strong>
                </div>
              )}
              <div className={`${styles.pricingRow} ${styles.pricingTotal}`}>
                <span>Total</span>
                <strong>{money(q.total)}</strong>
              </div>
              {q.notes && (
                <div className={styles.notes}>
                  <span>Notes from the kitchen</span>
                  <p>{q.notes}</p>
                </div>
              )}
              {q.validUntil && (
                <p className={styles.validUntil}>Valid through {q.validUntil}</p>
              )}
            </div>
          ) : (
            <div className={styles.pendingBox}>
              <p>Your quote is being prepared. Current status: <strong>{quote.status}</strong>.</p>
            </div>
          )}

          {canRespond && (
            <>
              {error && <div className={styles.errorMsg}>{error}</div>}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.declineBtn}
                  onClick={() => handleResponse('decline')}
                  disabled={submitting}
                >
                  Decline
                </button>
                <button
                  type="button"
                  className={styles.acceptBtn}
                  onClick={() => handleResponse('accept')}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Accept Quote'}
                </button>
              </div>
              {prefillAction && (
                <p className={styles.hint}>
                  Click <strong>{prefillAction === 'accept' ? 'Accept Quote' : 'Decline'}</strong> to confirm.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteResponse;
