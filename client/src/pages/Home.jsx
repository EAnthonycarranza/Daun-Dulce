import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CookieCard from '../components/ui/CookieCard';
import AccountPrompt from '../components/ui/AccountPrompt';
import api from '../services/api';
import logo from '../assets/images/DaunDulce_Logo.png';
import styles from './Home.module.css';

const Home = () => {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get('/cookies?featured=true');
        setFeatured(data.slice(0, 3));
      } catch {
        setFeatured([]);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className={styles.home}>
      <AccountPrompt />
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <img src={logo} alt="Daun Dulce" className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>Fresh-Baked Cookies Made with Love</h1>
          <p className={styles.heroSubtitle}>
            Soft, gooey, and baked to perfection -- every bite is a little moment of sweetness.
          </p>
          <Link to="/pre-order" className={styles.heroCta}>
            Pre-Order Now
          </Link>
        </div>
      </section>

      {/* Featured Flavors */}
      {featured.length > 0 && (
        <section className={`section ${styles.featured}`}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Our Favorite Flavors</h2>
            <p className={styles.sectionSubtitle}>Handcrafted with the finest ingredients</p>
            <div className={styles.cookieGrid}>
              {featured.map((cookie) => (
                <CookieCard key={cookie._id} cookie={cookie} />
              ))}
            </div>
            <div className={styles.viewAll}>
              <Link to="/menu" className={styles.viewAllLink}>
                View Full Menu →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Blurb */}
      <section className={styles.aboutBlurb}>
        <div className="container">
          <div className={styles.aboutContent}>
            <h2>Why Daun Dulce?</h2>
            <p>
              Every cookie we bake is made from scratch with love and the finest ingredients.
              We believe in creating treats that bring people together -- one sweet bite at a time.
            </p>
            <Link to="/about" className={styles.aboutLink}>Learn Our Story →</Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className="container">
          <h2>Ready to Satisfy Your Sweet Cravings?</h2>
          <p>Place your pre-order today and pick up fresh-baked cookies this weekend!</p>
          <Link to="/pre-order" className={styles.ctaBtn}>Order Now</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
