import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CookieCard from '../components/ui/CookieCard';
import api from '../services/api';
import styles from './Menu.module.css';

const pricing = [
  { quantity: '1 pc', price: '$3.50' },
  { quantity: '4 pcs', price: '$13.00' },
  { quantity: '6 pcs', price: '$18.00' },
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
        <h1>Our Menu</h1>
        <p>Every cookie is baked fresh, soft, gooey, and made with love</p>
      </section>

      {/* Pricing */}
      <section className={styles.pricing}>
        <div className="container">
          <div className={styles.priceCards}>
            {pricing.map((item) => (
              <div key={item.quantity} className={styles.priceCard}>
                <span className={styles.priceQty}>{item.quantity}</span>
                <span className={styles.priceAmount}>{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cookie Grid */}
      <section className="section">
        <div className="container">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--color-gray)' }}>Loading menu...</p>
          ) : cookies.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-gray)' }}>
              Check back soon for our menu!
            </p>
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
        <div className="container">
          <h2>Found Your Favorites?</h2>
          <p>Place your pre-order and pick them up fresh this weekend!</p>
          <Link to="/pre-order" className={styles.ctaBtn}>Pre-Order Now</Link>
        </div>
      </section>
    </div>
  );
};

export default Menu;
