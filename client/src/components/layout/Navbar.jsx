import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { useCustomer } from '../../context/CustomerContext';
import { useTheme } from '../../context/ThemeContext';
import logo from '../../assets/images/DaunDulce_Logo.png';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { customer } = useCustomer();
  const { mode, toggleTheme } = useTheme();
  const location = useLocation();

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <ul className={styles.leftLinks}>
          <li><NavLink to="/" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}>Home</NavLink></li>
          <li><NavLink to="/menu" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}>Menu</NavLink></li>
          <li><NavLink to="/about" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}>About</NavLink></li>
          <li><NavLink to="/contact" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}>Contact</NavLink></li>
        </ul>

        <Link to="/" className={styles.logo} onClick={closeMenu}>
          <img src={logo} alt="Daun Dulce" className={styles.logoImg} />
        </Link>

        <div className={styles.rightActions}>
          <NavLink
            to={customer ? '/my-orders' : '/login'}
            onClick={closeMenu}
            className={styles.accountBtn}
          >
            <FaUser size={11} /> {customer ? 'My Orders' : 'Sign In'}
          </NavLink>
          <NavLink to="/pre-order" onClick={closeMenu} className={styles.orderBtn}>
            Pre-Order
          </NavLink>
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme" title={mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'}>
            {mode === 'system' ? <FaDesktop /> : mode === 'light' ? <FaSun /> : <FaMoon />}
          </button>
          <button
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <div
          className={`${styles.backdrop} ${menuOpen ? styles.backdropOpen : ''}`}
          onClick={closeMenu}
          aria-hidden="true"
        />

        <ul
          id="mobile-nav"
          className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}
        >
          <li><NavLink to="/" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}>Home</NavLink></li>
          <li><NavLink to="/menu" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}>Menu</NavLink></li>
          <li><NavLink to="/about" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}>About</NavLink></li>
          <li><NavLink to="/contact" onClick={closeMenu} className={({ isActive }) => isActive ? styles.active : ''}>Contact</NavLink></li>
          <li>
            <NavLink
              to={customer ? '/my-orders' : '/login'}
              onClick={closeMenu}
              className={styles.accountBtn}
            >
              <FaUser size={12} /> {customer ? 'My Orders' : 'Sign In'}
            </NavLink>
          </li>
          <li>
            <NavLink to="/pre-order" onClick={closeMenu} className={styles.orderBtn}>
              Pre-Order
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
