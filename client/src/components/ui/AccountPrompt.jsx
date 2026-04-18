import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { useCustomer } from '../../context/CustomerContext';
import styles from './AccountPrompt.module.css';

const DISMISSED_KEY = 'daundulce_prompt_dismissed';

const AccountPrompt = () => {
  const [show, setShow] = useState(false);
  const { customer, loading } = useCustomer();

  useEffect(() => {
    if (loading) return;
    if (customer) return;

    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, [customer, loading]);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!show) return null;

  return (
    <div className={styles.overlay} onClick={handleDismiss}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleDismiss}><FaTimes /></button>
        <div className={styles.icon}>🍪</div>
        <h2 className={styles.title}>Track Your Orders</h2>
        <p className={styles.text}>
          Create a free account or sign in to track your cookie orders and order faster next time!
        </p>
        <div className={styles.actions}>
          <Link to="/login" className={styles.signInBtn} onClick={handleDismiss}>
            Sign In
          </Link>
          <Link to="/register" className={styles.registerBtn} onClick={handleDismiss}>
            Create Account
          </Link>
          <button className={styles.skipBtn} onClick={handleDismiss}>
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountPrompt;
