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
        <div className={styles.heroBackdrop} aria-hidden="true" />
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>Est. — Handcrafted Cookies</span>
          <div className={styles.heroLogoWrap}>
            <img src={logo} alt="Daun Dulce" className={styles.heroLogo} />
          </div>
          <h1 className={styles.heroTitle}>
            A little moment of <em>sweetness</em>,<br />baked with intention.
          </h1>
          <p className={styles.heroSubtitle}>
            Soft, gooey, and quietly decadent — small-batch cookies crafted
            with the finest ingredients and an unhurried hand.
          </p>
          <p className={styles.heroSlogan}>
            Same Flavor, Same Price, Always Delicious
          </p>
          <div className={styles.heroActions}>
            <Link to="/pre-order" className={styles.heroCta}>Pre-Order Now</Link>
            <Link to="/menu" className={styles.heroCtaGhost}>View the Menu</Link>
          </div>
        </div>
        <div className={styles.heroScroll} aria-hidden="true">
          <span>Scroll</span>
          <div className={styles.heroScrollLine} />
        </div>
      </section>

      {/* Featured Flavors */}
      {featured.length > 0 && (
        <section className={`section ${styles.featured}`}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span className="eyebrow">Our Selection</span>
              <h2 className={styles.sectionTitle}>
                Favorite <em>flavors</em>
              </h2>
              <div className="ornament"><span /></div>
              <p className={styles.sectionSubtitle}>
                Three signatures from the Daun Dulce kitchen — each one handcrafted
                with the finest ingredients we could find.
              </p>
            </div>
            <div className={styles.cookieGrid}>
              {featured.map((cookie) => (
                <CookieCard key={cookie._id} cookie={cookie} />
              ))}
            </div>
            <div className={styles.viewAll}>
              <Link to="/menu" className={styles.viewAllLink}>
                Explore the Full Menu
                <span className={styles.arrow}>→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Blurb */}
      <section className={styles.aboutBlurb}>
        <div className="container">
          <div className={styles.aboutGrid}>
            <div className={styles.aboutMonogram} aria-hidden="true">
              <img src={logo} alt="" />
            </div>
            <div className={styles.aboutContent}>
              <span className="eyebrow">Our Philosophy</span>
              <h2>Why <em>Daun Dulce</em>?</h2>
              <div className="ornament"><span /></div>
              <p>
                Every cookie is made from scratch — slowly, deliberately, with
                ingredients we'd put on our own table. We believe the smallest
                treats carry the largest moments, and we bake each batch like
                it matters. Because it does.
              </p>
              <Link to="/about" className={styles.aboutLink}>
                Learn Our Story <span className={styles.arrow}>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Experience strip */}
      <section className={styles.pillars}>
        <div className="container">
          <div className={styles.pillarGrid}>
            <div className={styles.pillar}>
              <span className={styles.pillarNum}>01</span>
              <h3>Small Batch</h3>
              <p>Baked in limited quantities so every cookie arrives fresh.</p>
            </div>
            <div className={styles.pillar}>
              <span className={styles.pillarNum}>02</span>
              <h3>Finest Ingredients</h3>
              <p>Premium butter, real vanilla, and chocolate worth savoring.</p>
            </div>
            <div className={styles.pillar}>
              <span className={styles.pillarNum}>03</span>
              <h3>Made With Love</h3>
              <p>Every tray leaves our kitchen with care — and a little magic.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBackdrop} aria-hidden="true" />
        <div className="container">
          <div className={styles.ctaInner}>
            <span className={styles.ctaEyebrow}>Pre-Orders Open</span>
            <h2>
              Ready to satisfy your <em>sweet</em> cravings?
            </h2>
            <p>Place your pre-order today and pick up fresh-baked cookies this weekend.</p>
            <Link to="/pre-order" className={styles.ctaBtn}>Reserve Your Box</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
