import { useState, useEffect, useCallback } from 'react';
import { FaInstagram, FaFacebookF, FaTiktok, FaEnvelope, FaPhone, FaShieldAlt } from 'react-icons/fa';
import api from '../services/api';
import styles from './Contact.module.css';

const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { a, b, answer: a + b };
};

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [formLoadedAt] = useState(Date.now());

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    // Honeypot check (bots fill hidden fields)
    if (honeypot) {
      setStatus({ type: 'success', message: 'Message sent successfully!' });
      setLoading(false);
      return;
    }

    // CAPTCHA check
    if (parseInt(captchaInput, 10) !== captcha.answer) {
      setStatus({ type: 'error', message: 'Incorrect answer. Please solve the math problem.' });
      refreshCaptcha();
      setLoading(false);
      return;
    }

    // Time check — bots submit instantly
    const secondsElapsed = (Date.now() - formLoadedAt) / 1000;
    if (secondsElapsed < 3) {
      setStatus({ type: 'error', message: 'Please take a moment before submitting.' });
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/contact', {
        ...form,
        captchaAnswer: captcha.answer,
        captchaInput: parseInt(captchaInput, 10),
        _timing: secondsElapsed,
      });
      setStatus({ type: 'success', message: data.message });
      setForm({ name: '', email: '', message: '' });
      setCaptchaInput('');
      refreshCaptcha();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to send message';
      setStatus({ type: 'error', message: msg });
      if (err.response?.data?.message?.toLowerCase().includes('captcha') || err.response?.data?.message?.toLowerCase().includes('verification')) {
        refreshCaptcha();
      }
    }
    setLoading(false);
  };

  return (
    <div className={styles.contact}>
      <section className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.eyebrow}>Say Hello</span>
          <h1>Contact <em>Us</em></h1>
          <div className="ornament"><span /></div>
          <p>We'd love to hear from you.</p>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          <div className={styles.grid}>
            {/* Contact Info */}
            <div className={styles.info}>
              <span className="eyebrow">Get in Touch</span>
              <h2>We'd love to <em>hear from you</em></h2>
              <p>
                Have a question about our cookies? Want to place a custom order?
                Feel free to reach out — we're happy to help.
              </p>

              <div className={styles.infoItem}>
                <FaPhone className={styles.infoIcon} />
                <a href="tel:+12105520937">(210) 552-0937</a>
              </div>

              <div className={styles.infoItem}>
                <FaEnvelope className={styles.infoIcon} />
                <a href="mailto:daundulce.com">daundulce.com</a>
              </div>

              <div className={styles.socialSection}>
                <h3>Follow Along</h3>
                <div className={styles.socialIcons}>
                  <a href="https://www.instagram.com/daundulce/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <FaInstagram />
                  </a>
                  <a href="https://www.tiktok.com/@daundulce" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                    <FaTiktok />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
              <h2>Send a <em>Message</em></h2>

              {status.message && (
                <div className={`${styles.alert} ${styles[status.type]}`}>
                  {status.message}
                </div>
              )}

              {/* Honeypot — invisible to real users, bots fill it */}
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

              <div className={styles.field}>
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Your Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={form.message}
                  onChange={handleChange}
                  required
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

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
