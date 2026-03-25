import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import AccountPrompt from '../components/ui/AccountPrompt';
import api from '../services/api';
import styles from './PreOrder.module.css';

const PreOrder = () => {
  const [pageContent, setPageContent] = useState(null);
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [telegramBot, setTelegramBot] = useState({ botName: '', enabled: false });
  const [availableFlavors, setAvailableFlavors] = useState([]);
  const { customer, customerToken } = useCustomer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, cookiesRes] = await Promise.all([
          api.get('/site-content/preorder'),
          api.get('/cookies'),
        ]);
        setPageContent(contentRes.data);
        setAvailableFlavors(cookiesRes.data.map((c) => c.name));
        setForm({
          customerName: '',
          contactEmail: '',
          contactPhone: '',
          quantity: '',
          quantityOther: '',
          flavors: [],
          flavorOther: '',
          paymentMethod: '',
          pickupDate: '',
          terms: Array(contentRes.data.terms.length).fill(false),
          specialRequests: '',
        });

        // Fetch Telegram bot info
        try {
          const { data } = await api.get('/orders/telegram-bot');
          setTelegramBot(data);
        } catch { /* Telegram not configured */ }
      } catch {
        setAvailableFlavors([]);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFlavorToggle = (flavor) => {
    setForm((prev) => ({
      ...prev,
      flavors: prev.flavors.includes(flavor)
        ? prev.flavors.filter((f) => f !== flavor)
        : [...prev.flavors, flavor],
    }));
  };

  const handleTermToggle = (index) => {
    setForm((prev) => {
      const terms = [...prev.terms];
      terms[index] = !terms[index];
      return { ...prev, terms };
    });
  };

  const allTermsAccepted = form ? form.terms.every(Boolean) : false;

  const isFormComplete = (() => {
    if (!form) return false;

    // Guest fields
    if (!customer) {
      if (!form.customerName.trim()) return false;
      if (!form.contactEmail.trim()) return false;
      if (!form.contactPhone.trim()) return false;
    }

    // Shared required fields
    if (!form.quantity) return false;
    if (form.quantity === 'Other' && !form.quantityOther.trim()) return false;
    if (form.flavors.length === 0 && !form.flavorOther.trim()) return false;
    if (!form.paymentMethod) return false;
    if (!form.pickupDate) return false;
    if (!allTermsAccepted) return false;

    return true;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (form.flavors.length === 0 && !form.flavorOther) {
      setStatus({ type: 'error', message: 'Please select at least one flavor.' });
      return;
    }

    if (!allTermsAccepted) {
      setStatus({ type: 'error', message: 'Please accept all terms and conditions.' });
      return;
    }

    setLoading(true);

    try {
      const flavors = [...form.flavors];
      if (form.flavorOther) flavors.push('Other');

      const orderData = {
        quantity: form.quantity === 'Other' ? 'Other' : form.quantity,
        quantityOther: form.quantity === 'Other' ? form.quantityOther : undefined,
        flavors,
        flavorOther: form.flavorOther || undefined,
        paymentMethod: form.paymentMethod,
        pickupDate: form.pickupDate,
        termsAccepted: true,
        specialRequests: form.specialRequests || undefined,
      };

      // Guest users must provide name, email, and phone
      if (!customer) {
        orderData.customerName = form.customerName;
        orderData.contactEmail = form.contactEmail;
        orderData.contactPhone = form.contactPhone;
      }

      const config = customerToken
        ? { headers: { Authorization: `Bearer ${customerToken}` } }
        : {};

      const response = await api.post('/orders', orderData, config);
      setOrderResult(response.data.order);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.message
        || 'Failed to submit order. Please try again.';
      setStatus({ type: 'error', message: msg });
    }
    setLoading(false);
  };

  if (!pageContent || !form) {
    return (
      <div className={styles.preorder}>
        <section className={styles.header}>
          <h1>Pre-Order Form</h1>
          <p>Loading...</p>
        </section>
      </div>
    );
  }

  if (submitted) {
    const telegramLink = telegramBot.enabled && telegramBot.botName && orderResult?.confirmationToken
      ? `https://t.me/${telegramBot.botName}?start=${orderResult.confirmationToken}`
      : null;

    return (
      <div className={styles.preorder}>
        <div className={styles.successPage}>
          <div className={styles.successCard}>
            <span className={styles.successIcon}>🍪</span>
            <h1>{pageContent.successTitle}</h1>
            <p>{pageContent.successMessage}</p>
            {orderResult && (
              <p className={styles.orderNumber}>
                Your Order #: <strong>{orderResult._id?.slice(-6).toUpperCase()}</strong>
              </p>
            )}
            <p className={styles.successNote}>{pageContent.successNote}</p>

            <div className={styles.confirmationNotice}>
              <p>A confirmation link has been sent to your <strong>email</strong>.</p>
              <p>Please check your inbox and click the link to confirm your order.</p>
              <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                Save your Order # to <a href="/track-order" style={{ color: 'inherit', fontWeight: 700 }}>track your order</a> anytime!
              </p>
            </div>

            {telegramLink && (
              <div className={styles.telegramSection}>
                <p className={styles.telegramLabel}>Want to confirm on your phone instead?</p>
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.telegramBtn}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Confirm via Telegram
                </a>
                <p className={styles.telegramHint}>
                  Opens Telegram — tap Start to confirm your order and get status updates on your phone!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.preorder}>
      <AccountPrompt />
      <section className={styles.header}>
        <h1>{pageContent.heading}</h1>
        <p>{pageContent.subtitle}</p>
      </section>

      <section className={styles.formSection}>
        <div className="container">
          <div className={styles.intro}>
            {pageContent.introParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {customer ? (
            <div className={styles.customerBanner}>
              Ordering as <strong>{customer.name}</strong> ({customer.email}, {customer.phone}) — your info will be used automatically.
            </div>
          ) : (
            <div className={styles.guestBanner}>
              <Link to="/login">Sign in</Link> or <Link to="/register">create an account</Link> to skip filling in your details and track your orders.
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            {status.message && (
              <div className={`${styles.alert} ${styles[status.type]}`}>
                {status.message}
              </div>
            )}

            {/* Guest-only fields: Name, Email, Phone */}
            {!customer && (
              <>
                <div className={styles.field}>
                  <label htmlFor="customerName">Your Name *</label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="contactEmail">Email Address *</label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="contactPhone">Phone Number *</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </>
            )}

            {/* Quantity */}
            <div className={styles.fieldGroup}>
              <label>How many cookies would you like? *</label>
              <div className={styles.radioGroup}>
                {pageContent.quantities.map((q) => (
                  <label key={q} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="quantity"
                      value={q}
                      checked={form.quantity === q}
                      onChange={handleChange}
                      required
                    />
                    <span>{q}</span>
                  </label>
                ))}
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="quantity"
                    value="Other"
                    checked={form.quantity === 'Other'}
                    onChange={handleChange}
                  />
                  <span>Other</span>
                </label>
              </div>
              {form.quantity === 'Other' && (
                <input
                  type="text"
                  name="quantityOther"
                  placeholder="Please specify quantity"
                  value={form.quantityOther}
                  onChange={handleChange}
                  className={styles.otherInput}
                />
              )}
            </div>

            {/* Flavors */}
            <div className={styles.fieldGroup}>
              <label>What flavor would you like? *</label>
              <p className={styles.fieldHint}>
                If you want more than one of the same cookies, please specify in "Other" box
              </p>
              <div className={styles.checkboxGroup}>
                {availableFlavors.map((flavor) => (
                  <label key={flavor} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.flavors.includes(flavor)}
                      onChange={() => handleFlavorToggle(flavor)}
                    />
                    <span>{flavor}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                name="flavorOther"
                placeholder="Other flavors or specify quantities (e.g., 2x Red Velvet)"
                value={form.flavorOther}
                onChange={handleChange}
                className={styles.otherInput}
              />
            </div>

            {/* Payment Method */}
            <div className={styles.fieldGroup}>
              <label>How would you like to pay? *</label>
              <div className={styles.radioGroup}>
                {pageContent.paymentMethods.map((method) => (
                  <label key={method} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={form.paymentMethod === method}
                      onChange={handleChange}
                      required
                    />
                    <span>{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pickup Date */}
            <div className={styles.fieldGroup}>
              <label>Pickup Date *</label>
              <div className={styles.radioGroup}>
                {pageContent.pickupDates.map((date) => (
                  <label key={date} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="pickupDate"
                      value={date}
                      checked={form.pickupDate === date}
                      onChange={handleChange}
                      required
                    />
                    <span>{date}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className={styles.fieldGroup}>
              <label>Terms & Conditions *</label>
              <p className={styles.fieldHint}>You must accept all terms to continue:</p>
              <div className={styles.termsGroup}>
                {pageContent.terms.map((term, i) => (
                  <label key={i} className={`${styles.termLabel} ${form.terms[i] ? styles.termAccepted : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.terms[i]}
                      onChange={() => handleTermToggle(i)}
                    />
                    <span>{term}</span>
                  </label>
                ))}
              </div>
              {!allTermsAccepted && form.terms.some(Boolean) && (
                <p className={styles.termsWarning}>Please accept all terms to continue.</p>
              )}
            </div>

            {/* Special Requests */}
            <div className={styles.field}>
              <label htmlFor="specialRequests">
                Special Requests - Please reach out to us via DM or email and we will try to accommodate
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                rows="3"
                value={form.specialRequests}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !isFormComplete}
            >
              {loading ? 'Submitting...' : !isFormComplete ? 'Please Fill All Required Fields' : 'Submit Pre-Order'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default PreOrder;
