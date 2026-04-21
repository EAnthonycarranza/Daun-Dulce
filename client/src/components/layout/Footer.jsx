import { Link } from 'react-router-dom';
import { FaInstagram, FaTiktok, FaEnvelope, FaPhone } from 'react-icons/fa';
import logo from '../../assets/images/DaunDulce_Logo.png';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <img src={logo} alt="Daun Dulce" className={styles.logo} />
            <p className={styles.tagline}>Handcrafted cookies, <em>baked with love</em>.</p>
            <div className={styles.socialIcons}>
              <a href="https://www.instagram.com/daundulce/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://www.tiktok.com/@daundulce" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <FaTiktok />
              </a>
            </div>
          </div>

          <div className={styles.columns}>
            <div className={styles.col}>
              <h4>Explore</h4>
              <Link to="/">Home</Link>
              <Link to="/menu">Menu</Link>
              <Link to="/events">Events</Link>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
            </div>

            <div className={styles.col}>
              <h4>Orders</h4>
              <Link to="/pre-order">Pre-Order</Link>
              <Link to="/track-order">Track Order</Link>
              <Link to="/my-orders">My Orders</Link>
              <Link to="/login">Sign In</Link>
            </div>

            <div className={styles.col}>
              <h4>Say Hello</h4>
              <a href="tel:+12105520937"><FaPhone size={11} /> (210) 552-0937</a>
              <a href="mailto:hello@daundulce.com"><FaEnvelope size={11} /> hello@daundulce.com</a>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} Daun Dulce — All rights reserved.</p>
          <p className={styles.made}>Crafted with care in every detail.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
