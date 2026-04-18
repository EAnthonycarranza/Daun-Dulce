import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CookieCard from '../components/ui/CookieCard';
import api from '../services/api';
import styles from './Menu.module.css';

const pricing = [
  { quantity: 'Single', pieces: '1 piece', price: '$3.50' },
  { quantity: 'Quartet', pieces: '4 pieces', price: '$13.00' },
  { quantity: 'Half Dozen', pieces: '6 pieces', price: '$18.00' },
];

const Menu = () => {
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCookies = async () => {
      try {
        const { data } = await api.get('/cookies');
        setCookies(data);
      } catch {
        setCookies([]);
      }
      setLoading(false);
    };
    fetchCookies();
  }, []);

  return (
    <div className={styles.menu}>
      {/* Header */}
      <section className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.eyebrow}>The Collection</span>
          <h1>Our <em>Menu</em></h1>
          <div className="ornament"><span /></div>
          <p>Every cookie, baked fresh — soft, gooey, and made with love.</p>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing}>
        <div className="container">
          <div className={styles.priceCards}>
            {pricing.map((item) => (
              <div key={item.quantity} className={styles.priceCard}>
                <span className={styles.priceQty}>{item.quantity}</span>
                <span className={styles.priceDivider} />
                <span className={styles.priceAmount}>{item.price}</span>
                <span className={styles.pricePieces}>{item.pieces}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cookie Grid */}
      <section className={styles.grid}>
        <div className="container">
          {loading ? (
            <p className={styles.emptyState}>Loading our menu…</p>
          ) : cookies.length === 0 ? (
            <p className={styles.emptyState}>Check back soon for our menu.</p>
          ) : (
            <div className={styles.cookieGrid}>
              {cookies.map((cookie) => (
                <CookieCard key={cookie._id} cookie={cookie} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaBackdrop} aria-hidden="true" />
        <div className="container">
          <div className={styles.ctaInner}>
            <span className={styles.ctaEyebrow}>Ready When You Are</span>
            <h2>Found your <em>favorites</em>?</h2>
            <p>Place your pre-order and pick them up fresh this weekend.</p>
            <Link to="/pre-order" className={styles.ctaBtn}>Pre-Order Now</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Menu;
