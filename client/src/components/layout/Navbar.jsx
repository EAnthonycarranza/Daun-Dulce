import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { useCustomer } from '../../context/CustomerContext';
import { useTheme } from '../../context/ThemeContext';
import logo from '../../assets/images/DaunDulce_Logo.png';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { customer } = useCustomer();
  const { mode, toggleTheme } = useTheme();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

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
          <button className={styles.hamburger} onClick={toggleMenu} aria-label="Toggle menu">
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
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
