import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import api from '../services/api';
import styles from './MyOrders.module.css';

const STATUS_COLORS = {
  pending: '#D4A017',
  confirmed: '#4A7C59',
  completed: '#6B7280',
  cancelled: '#C0392B',
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { customer, customerToken, logout } = useCustomer();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/customers/my-orders', {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        setOrders(data);
      } catch {
        setOrders([]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [customerToken]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>My Orders</h1>
        <div className={styles.headerRight}>
          <span className={styles.greeting}>
            Hello, <strong>{customer?.name}</strong>
          </span>
          <button onClick={handleLogout} className={styles.logoutBtn}>Sign Out</button>
        </div>
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>
          <h2>No orders yet</h2>
          <p>You haven't placed any orders. Start by pre-ordering some cookies!</p>
          <Link to="/pre-order" className={styles.orderLink}>Pre-Order Now</Link>
        </div>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <div key={order._id} className={styles.orderCard}>
              <div
                className={styles.orderTop}
                onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
              >
                <div className={styles.orderTopLeft}>
                  <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                  <span>{order.flavors.join(', ')}</span>
                </div>
                <div className={styles.orderTopRight}>
                  <span className={styles.statusBadge} style={{ background: STATUS_COLORS[order.status] }}>
                    {order.status}
                  </span>
                  <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                </div>
              </div>

              {expandedOrder === order._id && (
                <div className={styles.orderBody}>
                  <div className={styles.detailGrid}>
                    <div>
                      <strong>Quantity</strong>
                      <p>{order.quantity}{order.quantityOther ? ` (${order.quantityOther})` : ''}</p>
                    </div>
                    <div>
                      <strong>Flavors</strong>
                      <p>{order.flavors.join(', ')}{order.flavorOther ? ` (Other: ${order.flavorOther})` : ''}</p>
                    </div>
                    <div>
                      <strong>Payment</strong>
                      <p>{order.paymentMethod}</p>
                    </div>
                    <div>
                      <strong>Pickup</strong>
                      <p>{order.pickupDate}</p>
                    </div>
                    {order.specialRequests && (
                      <div className={styles.detailFull}>
                        <strong>Special Requests</strong>
                        <p>{order.specialRequests}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
