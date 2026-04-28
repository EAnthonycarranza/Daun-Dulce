import { useState, useEffect, useCallback } from 'react';
import {
  FaRing, FaBriefcase, FaHandHoldingHeart, FaBirthdayCake, FaBaby,
  FaGift, FaStar, FaCheckCircle, FaTruck, FaStore, FaShieldAlt
} from 'react-icons/fa';
import { useCustomer } from '../context/CustomerContext';
import api from '../services/api';
import AddressAutocomplete from '../components/ui/AddressAutocomplete';
import styles from './GroupQuote.module.css';

const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { a, b, answer: a + b };
};

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: FaRing },
  { value: 'corporate', label: 'Corporate', icon: FaBriefcase },
  { value: 'fundraiser', label: 'Fundraiser', icon: FaHandHoldingHeart },
  { value: 'birthday', label: 'Birthday', icon: FaBirthdayCake },
  { value: 'baby-shower', label: 'Baby Shower', icon: FaBaby },
  { value: 'holiday', label: 'Holiday', icon: FaGift },
  { value: 'other', label: 'Other', icon: FaStar },
];

const BUDGET_RANGES = ['Under $250', '$250 – $500', '$500 – $1,000', '$1,000 – $2,500', '$2,500+', 'Flexible'];

// Delivery is reserved for large catering orders. Below this guest count, only pickup is offered
// so we don't lose money traveling for small jobs.
const DELIVERY_MIN_GUESTS = 50;

const REFERRAL_OPTIONS = [
  'Instagram',
  'Facebook',
  'TikTok',
  'Google Search',
  'Friend or Family',
  'Past Customer',
  'Event or Market',
  'Other',
];

const GroupQuote = () => {
  const { customer } = useCustomer();
  const [availableFlavors, setAvailableFlavors] = useState([]);
  const [form, setForm] = useState({
    customerName: '',
    contactEmail: '',
    contactPhone: '',
    organization: '',
    eventType: '',
    eventTypeOther: '',
    eventName: '',
    eventDate: '',
    dateFlexible: false,
    guestCount: '',
    flavors: [],
    flavorNotes: '',
    budgetRange: '',
    fulfillment: 'pickup',
    deliveryAddress: '',
    details: '',
    referral: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [honeypot, setHoneypot] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [formLoadedAt] = useState(Date.now());

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  }, []);

  useEffect(() => {
    api.get('/cookies').then((res) => {
      setAvailableFlavors(res.data.map((c) => c.name));
    }).catch(() => setAvailableFlavors([]));
  }, []);

  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        customerName: f.customerName || customer.name || '',
        contactEmail: f.contactEmail || customer.email || '',
        contactPhone: f.contactPhone || customer.phone || '',
      }));
    }
  }, [customer]);

  // If guest count drops below the catering threshold, force pickup (delivery isn't offered for small orders)
  const deliveryEligible = Number(form.guestCount) >= DELIVERY_MIN_GUESTS;
  useEffect(() => {
    if (!deliveryEligible && form.fulfillment === 'delivery') {
      setForm((f) => ({ ...f, fulfillment: 'pickup', deliveryAddress: '' }));
    }
  }, [deliveryEligible, form.fulfillment]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleArrayItem = (field, value) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.eventType) return setError('Please choose an event type.');
    if (!form.customerName.trim()) return setError('Please enter your name.');
    if (!form.contactEmail.trim()) return setError('Please enter your email.');
    if (!form.contactPhone.trim()) return setError('Please enter your phone number.');
    if (!form.guestCount || Number(form.guestCount) < 1) return setError('Please enter guest count.');
    if (form.eventType === 'other' && !form.eventTypeOther.trim()) {
      return setError('Please describe your event type.');
    }
    if (form.fulfillment === 'delivery' && !form.deliveryAddress.trim()) {
      return setError('Please provide a delivery address.');
    }

    // Honeypot check
    if (honeypot) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // CAPTCHA check
    if (parseInt(captchaInput, 10) !== captcha.answer) {
      setError('Incorrect answer. Please solve the math problem.');
      refreshCaptcha();
      return;
    }

    // Time check
    const secondsElapsed = (Date.now() - formLoadedAt) / 1000;
    if (secondsElapsed < 3) {
      setError('Please take a moment before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/quotes', {
        ...form,
        guestCount: Number(form.guestCount),
        captchaAnswer: captcha.answer,
        captchaInput: parseInt(captchaInput, 10),
        _timing: secondsElapsed,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quote request.');
      if (err.response?.data?.message?.toLowerCase().includes('captcha') || err.response?.data?.message?.toLowerCase().includes('verification')) {
        refreshCaptcha();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}><FaCheckCircle /></div>
            <h1>Request Received</h1>
            <p className={styles.successLead}>
              Thank you, <strong>{form.customerName.split(' ')[0]}</strong>! We've got your details and will reach out within <strong>1–2 business days</strong> with a custom quote.
            </p>
            <p className={styles.successNote}>
              A confirmation has been sent to <strong>{form.contactEmail}</strong>. Watch your inbox (and spam folder, just in case).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <span className="eyebrow">Private &amp; Group Events</span>
          <h1>Custom Quotes for Your Celebration</h1>
          <p>
            Weddings, corporate gatherings, fundraisers, showers &amp; more — let's design a cookie
            experience your guests will remember. Share your vision below and we'll craft a custom quote.
          </p>
        </div>
      </header>

      <div className={styles.container}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* ======= EVENT TYPE ======= */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionStep}>01</span>
              <div>
                <h2>What kind of event?</h2>
                <p>Choose the closest match — we'll fine-tune details later.</p>
              </div>
            </div>
            <div className={styles.eventGrid}>
              {EVENT_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.eventChoice} ${form.eventType === value ? styles.eventActive : ''}`}
                  onClick={() => setForm((f) => ({ ...f, eventType: value }))}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {form.eventType === 'other' && (
              <div className={styles.field} style={{ marginTop: 16 }}>
                <label>Describe your event *</label>
                <input
                  name="eventTypeOther"
                  value={form.eventTypeOther}
                  onChange={handleChange}
                  placeholder="e.g. anniversary, team retreat, gender reveal"
                />
              </div>
            )}
          </section>

          {/* ======= EVENT DETAILS ======= */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionStep}>02</span>
              <div>
                <h2>Event Details</h2>
                <p>When, where, and how many.</p>
              </div>
            </div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Event / Company Name</label>
                <input
                  name="eventName"
                  value={form.eventName}
                  onChange={handleChange}
                  placeholder="e.g. Sarah &amp; James Wedding, Acme Q4 Retreat"
                />
              </div>
              <div className={styles.field}>
                <label>Organization (optional)</label>
                <input
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  placeholder="Company, non-profit, or school"
                />
              </div>
              <div className={styles.field}>
                <label>Event Date</label>
                <input
                  type="date"
                  name="eventDate"
                  value={form.eventDate}
                  onChange={handleChange}
                  disabled={form.dateFlexible}
                />
                <label className={styles.inlineCheck}>
                  <input
                    type="checkbox"
                    name="dateFlexible"
                    checked={form.dateFlexible}
                    onChange={handleChange}
                  />
                  <span>Date is flexible</span>
                </label>
              </div>
              <div className={styles.field}>
                <label>Guest Count *</label>
                <input
                  type="number"
                  min="1"
                  name="guestCount"
                  value={form.guestCount}
                  onChange={handleChange}
                  placeholder="e.g. 80"
                />
              </div>
            </div>
          </section>

          {/* ======= COOKIES ======= */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionStep}>03</span>
              <div>
                <h2>The Cookies</h2>
                <p>Pick your favorites or tell us what you're dreaming of.</p>
              </div>
            </div>

            {availableFlavors.length > 0 && (
              <div className={styles.chipGrid}>
                {availableFlavors.map((flavor) => (
                  <button
                    key={flavor}
                    type="button"
                    className={`${styles.chip} ${form.flavors.includes(flavor) ? styles.chipActive : ''}`}
                    onClick={() => toggleArrayItem('flavors', flavor)}
                  >
                    {flavor}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.field}>
              <label>Flavor Notes (optional)</label>
              <textarea
                rows="2"
                name="flavorNotes"
                value={form.flavorNotes}
                onChange={handleChange}
                placeholder="Any custom flavors, favorites, or ideas you've seen?"
              />
            </div>
          </section>

          {/* ======= FULFILLMENT + BUDGET ======= */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionStep}>04</span>
              <div>
                <h2>Logistics</h2>
                <p>How we'll get the cookies to you.</p>
              </div>
            </div>

            <div className={styles.fulfillmentRow}>
              <button
                type="button"
                className={`${styles.fulfillmentChoice} ${form.fulfillment === 'pickup' ? styles.fulfillmentActive : ''}`}
                onClick={() => setForm((f) => ({ ...f, fulfillment: 'pickup' }))}
              >
                <FaStore />
                <div>
                  <strong>Pickup</strong>
                  <span>Collect from our kitchen</span>
                </div>
              </button>
              <button
                type="button"
                className={`${styles.fulfillmentChoice} ${form.fulfillment === 'delivery' ? styles.fulfillmentActive : ''}`}
                onClick={() => deliveryEligible && setForm((f) => ({ ...f, fulfillment: 'delivery' }))}
                disabled={!deliveryEligible}
                title={!deliveryEligible ? `Delivery is available for orders of ${DELIVERY_MIN_GUESTS}+ guests.` : ''}
                style={!deliveryEligible ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                <FaTruck />
                <div>
                  <strong>Delivery</strong>
                  <span>
                    {deliveryEligible
                      ? 'We bring them to you'
                      : `Catering only · ${DELIVERY_MIN_GUESTS}+ guests`}
                  </span>
                </div>
              </button>
            </div>

            {!deliveryEligible && (
              <p className={styles.submitNote} style={{ marginTop: -10, marginBottom: 18, textAlign: 'left' }}>
                Delivery is reserved for catering orders of <strong>{DELIVERY_MIN_GUESTS}+ guests</strong>. For smaller orders, please choose pickup.
              </p>
            )}

            {form.fulfillment === 'delivery' && (
              <div className={styles.field}>
                <label>Delivery Address *</label>
                <AddressAutocomplete
                  value={form.deliveryAddress}
                  onChange={handleChange}
                  onPlace={(place) => {
                    if (place?.geometry?.location) {
                      setForm((f) => ({
                        ...f,
                        deliveryLat: place.geometry.location.lat(),
                        deliveryLng: place.geometry.location.lng(),
                        deliveryPlaceId: place.place_id || '',
                      }));
                    }
                  }}
                  placeholder="Start typing your address — we'll autocomplete it"
                  required
                />
              </div>
            )}

            <div className={styles.field}>
              <label>Budget Range (optional)</label>
              <div className={styles.chipGrid}>
                {BUDGET_RANGES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`${styles.chip} ${form.budgetRange === b ? styles.chipActive : ''}`}
                    onClick={() => setForm((f) => ({ ...f, budgetRange: f.budgetRange === b ? '' : b }))}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ======= CONTACT ======= */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionStep}>05</span>
              <div>
                <h2>Your Info</h2>
                <p>So we know where to send your custom quote.</p>
              </div>
            </div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Your Name *</label>
                <input name="customerName" value={form.customerName} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Email *</label>
                <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Phone *</label>
                <input type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>How did you hear about us?</label>
                <select
                  name="referral"
                  value={form.referral}
                  onChange={handleChange}
                >
                  <option value="">— Select an option —</option>
                  {REFERRAL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label>Anything else we should know?</label>
              <textarea
                rows="4"
                name="details"
                value={form.details}
                onChange={handleChange}
                placeholder="Color palette, packaging preferences, inspiration, dietary concerns, timeline…"
              />
            </div>

            {/* Honeypot */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                type="text"
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* CAPTCHA */}
            <div className={styles.captchaBox}>
              <div className={styles.captchaHeader}>
                <FaShieldAlt className={styles.captchaIcon} />
                <span>Verify you're human</span>
              </div>
              <div className={styles.captchaChallenge}>
                <span className={styles.captchaQuestion}>
                  What is <strong>{captcha.a} + {captcha.b}</strong>?
                </span>
                <input
                  type="number"
                  className={styles.captchaInput}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="?"
                  required
                  min="0"
                  max="99"
                />
                <button
                  type="button"
                  className={styles.captchaRefresh}
                  onClick={refreshCaptcha}
                  title="New question"
                >
                  ↻
                </button>
              </div>
            </div>
          </section>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.submitBar}>
            <p className={styles.submitNote}>
              No commitment — a team member will review and send you a custom quote.
            </p>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Sending…' : 'Request My Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupQuote;
