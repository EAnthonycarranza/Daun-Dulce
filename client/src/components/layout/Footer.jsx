import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaTiktok } from 'react-icons/fa';
import logo from '../../assets/images/WideLogo.png';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <img src={logo} alt="Daun Dulce" className={styles.logo} />
          <p className={styles.tagline}>Fresh-baked cookies made with love</p>
        </div>

        <div className={styles.links}>
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/pre-order">Pre-Order</Link>
        </div>

        <div className={styles.social}>
          <h4>Follow Us</h4>
          <div className={styles.socialIcons}>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <FaTiktok />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} Daun Dulce. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
