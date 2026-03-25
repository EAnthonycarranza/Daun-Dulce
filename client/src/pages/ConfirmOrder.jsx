import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import styles from './ConfirmOrder.module.css';

const ConfirmOrder = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading, confirmed, already, error
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const confirmOrder = async () => {
      try {
        const { data } = await api.get(`/orders/confirm/${token}`);
        setOrder(data.order);
        setStatus(data.alreadyConfirmed ? 'already' : 'confirmed');
      } catch (err) {
        setStatus('error');
      }
    };
    confirmOrder();
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {status === 'loading' && (
          <>
            <span className={styles.icon}>⏳</span>
            <h1>Confirming your order...</h1>
            <p>Please wait a moment.</p>
          </>
        )}

        {status === 'confirmed' && (
          <>
            <span className={styles.icon}>✅</span>
            <h1>Order Confirmed!</h1>
            <p>Your pre-order has been confirmed successfully. We'll start preparing your cookies!</p>
            {order && (
              <div className={styles.summary}>
                <p><strong>Order #{order._id?.slice(-6).toUpperCase()}</strong></p>
                <p>{order.customerName}</p>
                <p>{order.quantity}{order.quantityOther ? ` (${order.quantityOther})` : ''}</p>
                <p>Pickup: {order.pickupDate}</p>
              </div>
            )}
            <Link to="/" className={styles.homeLink}>Back to Home</Link>
          </>
        )}

        {status === 'already' && (
          <>
            <span className={styles.icon}>👍</span>
            <h1>Already Confirmed</h1>
            <p>This order has already been confirmed. No further action needed!</p>
            <Link to="/" className={styles.homeLink}>Back to Home</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <span className={styles.icon}>❌</span>
            <h1>Invalid Link</h1>
            <p>This confirmation link is invalid or has expired. Please contact us if you need help.</p>
            <Link to="/contact" className={styles.homeLink}>Contact Us</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmOrder;
