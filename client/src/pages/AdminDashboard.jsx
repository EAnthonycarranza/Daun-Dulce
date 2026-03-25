import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaStar, FaRegStar, FaImage, FaTimes, FaUser, FaEnvelope, FaPhone, FaSun, FaMoon, FaDesktop, FaArrowLeft, FaUndo, FaPaperPlane, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import styles from './AdminDashboard.module.css';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_COLORS = {
  pending: '#D4A017',
  confirmed: '#4A7C59',
  completed: '#6B7280',
  cancelled: '#C0392B',
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [customerProfileId, setCustomerProfileId] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const openCustomerProfile = (customerId) => {
    setCustomerProfileId(customerId);
    setActiveTab('customer-profile');
  };

  const closeCustomerProfile = () => {
    setCustomerProfileId(null);
    setActiveTab('customers');
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1>Daun Dulce Admin</h1>
          <div className={styles.headerRight}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                Orders
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'products' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Products
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'customers' || activeTab === 'customer-profile' ? styles.tabActive : ''}`}
                onClick={() => { setCustomerProfileId(null); setActiveTab('customers'); }}
              >
                Customers
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'pages' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('pages')}
              >
                Pages
              </button>
            </div>
            <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle theme" title={mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'}>
              {mode === 'system' ? <FaDesktop /> : mode === 'light' ? <FaSun /> : <FaMoon />}
            </button>
            <button onClick={handleLogout} className={styles.logoutBtn}>Log Out</button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {activeTab === 'orders' && <OrdersPanel />}
        {activeTab === 'products' && <ProductsPanel />}
        {activeTab === 'customers' && <CustomersPanel onOpenProfile={openCustomerProfile} />}
        {activeTab === 'customer-profile' && customerProfileId && (
          <CustomerProfile customerId={customerProfileId} onBack={closeCustomerProfile} />
        )}
        {activeTab === 'pages' && <PagesPanel />}
      </div>
    </div>
  );
};

/* ===================== ORDERS PANEL ===================== */

const OrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null, customerName: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, orderId: null, customerName: '' });
  const [undoModal, setUndoModal] = useState({ open: false, orderId: null, customerName: '', currentStatus: '' });

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await api.get('/orders', { params });
      setOrders(data);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 15 seconds so Telegram/email confirmations show up in real-time
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [statusFilter, search]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch { /* ignore */ }
  };

  const deleteOrder = async (orderId) => {
    try {
      await api.delete(`/orders/${orderId}`);
      fetchOrders();
    } catch { /* ignore */ }
  };

  const resendConfirmation = async (orderId, method = 'all') => {
    try {
      const { data } = await api.post(`/orders/${orderId}/resend-confirmation`, { method });
      const parts = [];
      if (data.emailSent) parts.push('Email');
      if (data.telegramSent) parts.push('Telegram');
      if (parts.length > 0) {
        alert(`Confirmation resent via: ${parts.join(' & ')}`);
      } else {
        alert('No confirmation could be sent. Customer may not have email or Telegram linked.');
      }
    } catch {
      alert('Failed to resend confirmation.');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  const getContactDisplay = (order) => {
    if (order.contactEmail && order.contactPhone) {
      return `${order.contactEmail} | ${order.contactPhone}`;
    }
    return order.contact || order.contactEmail || order.contactPhone || '';
  };

  return (
    <>
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by name, contact, or Order # ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.statusFilters}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${statusFilter === s ? styles.filterActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{orders.length}</span>
          <span className={styles.statLabel}>
            {statusFilter === 'all' ? 'Total Orders' : `${statusFilter} Orders`}
          </span>
        </div>
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className={styles.emptyText}>No orders found.</p>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <div key={order._id} className={styles.orderCard}>
              <div
                className={styles.orderHeader}
                onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
              >
                <div className={styles.orderInfo}>
                  <h3><span className={styles.orderIdInline}>#{order._id.slice(-6).toUpperCase()}</span> {order.customerName}</h3>
                  <span className={styles.orderContact}>{getContactDisplay(order)}</span>
                </div>
                <div className={styles.orderMeta}>
                  <span className={styles.statusBadge} style={{ background: STATUS_COLORS[order.status] }}>
                    {order.status}
                  </span>
                  <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                </div>
              </div>

              {expandedOrder === order._id && (
                <div className={styles.orderDetails}>
                  {/* Confirmation status: Email + Telegram */}
                  <div className={styles.confirmationStatus}>
                    {order.emailConfirmed ? (
                      <span className={styles.confirmedBadge}><FaCheckCircle /> Confirmed{order.telegramChatId ? ' (via Telegram)' : ' (via Email)'}</span>
                    ) : (
                      <span className={styles.unconfirmedBadge}>
                        <FaTimesCircle /> Not Confirmed
                      </span>
                    )}
                    {order.telegramChatId && (
                      <span className={styles.telegramLinkedBadge}>Telegram Linked</span>
                    )}
                    {!order.emailConfirmed && (
                      <div className={styles.resendActions}>
                        <button
                          className={styles.resendBtn}
                          onClick={(e) => { e.stopPropagation(); resendConfirmation(order._id, 'email'); }}
                          title="Resend confirmation via email"
                        >
                          <FaPaperPlane /> Resend Email
                        </button>
                        {order.telegramChatId && (
                          <button
                            className={styles.resendTelegramBtn}
                            onClick={(e) => { e.stopPropagation(); resendConfirmation(order._id, 'telegram'); }}
                            title="Resend confirmation via Telegram"
                          >
                            <FaPaperPlane /> Resend Telegram
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.detailGrid}>
                    {order.contactEmail && (
                      <div>
                        <strong>Email:</strong>
                        <p>{order.contactEmail}</p>
                      </div>
                    )}
                    {order.contactPhone && (
                      <div>
                        <strong>Phone:</strong>
                        <p>{order.contactPhone}</p>
                      </div>
                    )}
                    <div>
                      <strong>Quantity:</strong>
                      <p>{order.quantity}{order.quantityOther ? ` (${order.quantityOther})` : ''}</p>
                    </div>
                    <div>
                      <strong>Flavors:</strong>
                      <p>{order.flavors.join(', ')}{order.flavorOther ? ` (Other: ${order.flavorOther})` : ''}</p>
                    </div>
                    <div>
                      <strong>Payment:</strong>
                      <p>{order.paymentMethod}</p>
                    </div>
                    <div>
                      <strong>Pickup:</strong>
                      <p>{order.pickupDate}</p>
                    </div>
                    {order.specialRequests && (
                      <div className={styles.detailFull}>
                        <strong>Special Requests:</strong>
                        <p>{order.specialRequests}</p>
                      </div>
                    )}
                  </div>
                  <div className={styles.orderActions}>
                    {order.status === 'pending' && (
                      <button className={styles.confirmBtn} onClick={() => updateStatus(order._id, 'confirmed')}>Confirm</button>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button className={styles.completeBtn} onClick={() => updateStatus(order._id, 'completed')}>Complete</button>
                    )}
                    {/* Undo: revert confirmed or completed back to pending */}
                    {(order.status === 'confirmed' || order.status === 'completed') && (
                      <button
                        className={styles.undoBtn}
                        onClick={() => setUndoModal({ open: true, orderId: order._id, customerName: order.customerName, currentStatus: order.status })}
                      >
                        <FaUndo /> Undo
                      </button>
                    )}
                    {order.status !== 'cancelled' && (
                      <button className={styles.cancelBtn} onClick={() => setCancelModal({ open: true, orderId: order._id, customerName: order.customerName })}>Cancel</button>
                    )}
                    {/* Undo cancelled: revert back to pending */}
                    {order.status === 'cancelled' && (
                      <button
                        className={styles.undoBtn}
                        onClick={() => setUndoModal({ open: true, orderId: order._id, customerName: order.customerName, currentStatus: order.status })}
                      >
                        <FaUndo /> Restore
                      </button>
                    )}
                    <button className={styles.deleteBtn} onClick={() => setDeleteModal({ open: true, orderId: order._id, customerName: order.customerName })}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Undo Modal */}
      {undoModal.open && (
        <div className={styles.modalOverlay} onClick={() => setUndoModal({ open: false, orderId: null, customerName: '', currentStatus: '' })}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}><FaUndo /></div>
            <h3 className={styles.modalTitle}>
              {undoModal.currentStatus === 'cancelled' ? 'Restore Order?' : 'Undo Order Status?'}
            </h3>
            <p className={styles.modalText}>
              {undoModal.currentStatus === 'cancelled'
                ? <>Are you sure you want to restore the order for <strong>{undoModal.customerName}</strong> back to <strong>pending</strong>?</>
                : <>Are you sure you want to revert the order for <strong>{undoModal.customerName}</strong> from <strong>{undoModal.currentStatus}</strong> back to <strong>pending</strong>?</>
              }
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalKeepBtn}
                onClick={() => setUndoModal({ open: false, orderId: null, customerName: '', currentStatus: '' })}
              >
                Never Mind
              </button>
              <button
                className={styles.modalUndoBtn}
                onClick={() => {
                  updateStatus(undoModal.orderId, 'pending');
                  setUndoModal({ open: false, orderId: null, customerName: '', currentStatus: '' });
                }}
              >
                Yes, Revert to Pending
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModal.open && (
        <div className={styles.modalOverlay} onClick={() => setCancelModal({ open: false, orderId: null, customerName: '' })}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>⚠️</div>
            <h3 className={styles.modalTitle}>Cancel Order?</h3>
            <p className={styles.modalText}>
              Are you sure you want to cancel the order for <strong>{cancelModal.customerName}</strong>? This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalKeepBtn}
                onClick={() => setCancelModal({ open: false, orderId: null, customerName: '' })}
              >
                Keep Order
              </button>
              <button
                className={styles.modalCancelBtn}
                onClick={() => {
                  updateStatus(cancelModal.orderId, 'cancelled');
                  setCancelModal({ open: false, orderId: null, customerName: '' });
                }}
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.open && (
        <div className={styles.modalOverlay} onClick={() => setDeleteModal({ open: false, orderId: null, customerName: '' })}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🗑️</div>
            <h3 className={styles.modalTitle}>Delete Order?</h3>
            <p className={styles.modalText}>
              Are you sure you want to permanently delete the order for <strong>{deleteModal.customerName}</strong>? This action cannot be undone and all order data will be lost.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalKeepBtn}
                onClick={() => setDeleteModal({ open: false, orderId: null, customerName: '' })}
              >
                Keep Order
              </button>
              <button
                className={styles.modalCancelBtn}
                onClick={() => {
                  deleteOrder(deleteModal.orderId);
                  setDeleteModal({ open: false, orderId: null, customerName: '' });
                }}
              >
                Yes, Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ===================== PRODUCTS PANEL ===================== */

const ProductsPanel = () => {
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCookie, setEditingCookie] = useState(null);

  const fetchCookies = async () => {
    try {
      const { data } = await api.get('/cookies/admin');
      setCookies(data);
    } catch {
      setCookies([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCookies();
  }, []);

  const deleteCookie = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cookie?')) return;
    try {
      await api.delete(`/cookies/${id}`);
      fetchCookies();
    } catch { /* ignore */ }
  };

  const toggleFeatured = async (cookie) => {
    try {
      const formData = new FormData();
      formData.append('name', cookie.name);
      formData.append('description', cookie.description);
      formData.append('tags', JSON.stringify(cookie.tags));
      formData.append('featured', String(!cookie.featured));
      formData.append('available', String(cookie.available));
      formData.append('sortOrder', String(cookie.sortOrder));
      await api.put(`/cookies/${cookie._id}`, formData);
      fetchCookies();
    } catch { /* ignore */ }
  };

  const toggleAvailable = async (cookie) => {
    try {
      const formData = new FormData();
      formData.append('name', cookie.name);
      formData.append('description', cookie.description);
      formData.append('tags', JSON.stringify(cookie.tags));
      formData.append('featured', String(cookie.featured));
      formData.append('available', String(!cookie.available));
      formData.append('sortOrder', String(cookie.sortOrder));
      await api.put(`/cookies/${cookie._id}`, formData);
      fetchCookies();
    } catch { /* ignore */ }
  };

  const handleEdit = (cookie) => {
    setEditingCookie(cookie);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingCookie(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCookie(null);
    fetchCookies();
  };

  if (showForm) {
    return <CookieForm cookie={editingCookie} onClose={handleFormClose} />;
  }

  return (
    <>
      <div className={styles.productHeader}>
        <h2>Manage Products</h2>
        <button className={styles.addBtn} onClick={handleAdd}>
          <FaPlus /> Add Cookie
        </button>
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading products...</p>
      ) : cookies.length === 0 ? (
        <p className={styles.emptyText}>No cookies yet. Add your first one!</p>
      ) : (
        <div className={styles.productGrid}>
          {cookies.map((cookie) => (
            <div key={cookie._id} className={`${styles.productCard} ${!cookie.available ? styles.unavailable : ''}`}>
              <div className={styles.productImage}>
                {cookie.image ? (
                  <img src={cookie.image} alt={cookie.name} />
                ) : (
                  <div className={styles.productPlaceholder}>
                    <FaImage />
                  </div>
                )}
                {!cookie.available && <div className={styles.unavailableBadge}>Unavailable</div>}
              </div>
              <div className={styles.productInfo}>
                <div className={styles.productNameRow}>
                  <h3>{cookie.name}</h3>
                  <button
                    className={styles.starBtn}
                    onClick={() => toggleFeatured(cookie)}
                    title={cookie.featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    {cookie.featured ? <FaStar color="#D4A017" /> : <FaRegStar />}
                  </button>
                </div>
                <p className={styles.productDesc}>{cookie.description}</p>
                {cookie.tags.length > 0 && (
                  <div className={styles.productTags}>
                    {cookie.tags.map((tag) => (
                      <span key={tag} className={styles.productTag}>{tag}</span>
                    ))}
                  </div>
                )}
                <div className={styles.productActions}>
                  <button className={styles.editBtn} onClick={() => handleEdit(cookie)}>
                    <FaEdit /> Edit
                  </button>
                  <button
                    className={styles.toggleBtn}
                    onClick={() => toggleAvailable(cookie)}
                  >
                    {cookie.available ? 'Hide' : 'Show'}
                  </button>
                  <button className={styles.deleteBtn} onClick={() => deleteCookie(cookie._id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ===================== COOKIE FORM ===================== */

const CookieForm = ({ cookie, onClose }) => {
  const [name, setName] = useState(cookie?.name || '');
  const [description, setDescription] = useState(cookie?.description || '');
  const [tags, setTags] = useState(cookie?.tags?.join(', ') || '');
  const [featured, setFeatured] = useState(cookie?.featured || false);
  const [available, setAvailable] = useState(cookie?.available !== false);
  const [sortOrder, setSortOrder] = useState(cookie?.sortOrder || 0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(cookie?.image || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = async () => {
    if (cookie?._id && cookie.image) {
      try {
        await api.delete(`/cookies/${cookie._id}/image`);
      } catch { /* ignore */ }
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('tags', JSON.stringify(tags.split(',').map((t) => t.trim()).filter(Boolean)));
      formData.append('featured', String(featured));
      formData.append('available', String(available));
      formData.append('sortOrder', String(sortOrder));
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (cookie?._id) {
        await api.put(`/cookies/${cookie._id}`, formData);
      } else {
        await api.post('/cookies', formData);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save cookie');
    }
    setSaving(false);
  };

  return (
    <div className={styles.formWrapper}>
      <div className={styles.formHeader}>
        <h2>{cookie ? 'Edit Cookie' : 'Add New Cookie'}</h2>
        <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
      </div>

      {error && <div className={styles.formError}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.cookieForm}>
        {/* Image Upload */}
        <div className={styles.imageUpload}>
          <div className={styles.imagePreviewBox} onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <FaImage size={32} />
                <span>Click to upload image</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          {imagePreview && (
            <button type="button" className={styles.removeImgBtn} onClick={removeImage}>
              Remove Image
            </button>
          )}
        </div>

        <div className={styles.formFields}>
          <div className={styles.formField}>
            <label>Cookie Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className={styles.formField}>
            <label>Description *</label>
            <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className={styles.formField}>
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Chocolate, Premium, Fan Favorite"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <label className={styles.checkboxField}>
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              <span>Featured on homepage</span>
            </label>

            <label className={styles.checkboxField}>
              <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
              <span>Available for ordering</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelFormBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : cookie ? 'Update Cookie' : 'Add Cookie'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/* ===================== CUSTOMERS PANEL ===================== */

const CustomersPanel = ({ onOpenProfile }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get('/customers/all', { params });
      setCustomers(data);
    } catch {
      setCustomers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <>
      <div className={styles.productHeader}>
        <h2>Customers</h2>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{customers.length}</span>
          <span className={styles.statLabel}>Total Customers</span>
        </div>
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading customers...</p>
      ) : customers.length === 0 ? (
        <p className={styles.emptyText}>No customers found.</p>
      ) : (
        <div className={styles.orderList}>
          {customers.map((cust) => (
            <div key={cust._id} className={styles.customerCard}>
              <div
                className={styles.customerHeader}
                onClick={() => onOpenProfile(cust._id)}
              >
                <div className={styles.customerInfo}>
                  <h3><FaUser size={12} /> {cust.name}</h3>
                  <div className={styles.customerMeta}>
                    <span><FaEnvelope size={11} /> {cust.email}</span>
                    <span><FaPhone size={11} /> {cust.phone}</span>
                  </div>
                </div>
                <div className={styles.customerStats}>
                  <span className={styles.orderCountBadge}>
                    {cust.orderCount} {cust.orderCount === 1 ? 'order' : 'orders'}
                  </span>
                  <span className={styles.orderDate}>Joined {formatDate(cust.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ===================== CUSTOMER PROFILE ===================== */

const CustomerProfile = ({ customerId, onBack }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/customers/${customerId}`);
        setProfile(data);
      } catch {
        setProfile(null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [customerId]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  const formatShortDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) return <p className={styles.loadingText}>Loading customer profile...</p>;
  if (!profile) return <p className={styles.emptyText}>Customer not found.</p>;

  const statusCounts = {
    pending: profile.orders.filter((o) => o.status === 'pending').length,
    confirmed: profile.orders.filter((o) => o.status === 'confirmed').length,
    completed: profile.orders.filter((o) => o.status === 'completed').length,
    cancelled: profile.orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <>
      <button className={styles.backBtn} onClick={onBack}>
        <FaArrowLeft /> Back to Customers
      </button>

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            <FaUser size={28} />
          </div>
          <div className={styles.profileInfo}>
            <h2>{profile.name}</h2>
            <div className={styles.profileMeta}>
              <span><FaEnvelope size={13} /> {profile.email}</span>
              <span><FaPhone size={13} /> {profile.phone}</span>
            </div>
            <span className={styles.profileJoined}>Member since {formatShortDate(profile.createdAt)}</span>
          </div>
        </div>

        <div className={styles.profileStats}>
          <div className={styles.profileStatItem}>
            <span className={styles.profileStatNum}>{profile.orderCount}</span>
            <span className={styles.profileStatLabel}>Total Orders</span>
          </div>
          <div className={styles.profileStatItem}>
            <span className={styles.profileStatNum} style={{ color: '#D4A017' }}>{statusCounts.pending}</span>
            <span className={styles.profileStatLabel}>Pending</span>
          </div>
          <div className={styles.profileStatItem}>
            <span className={styles.profileStatNum} style={{ color: '#4A7C59' }}>{statusCounts.confirmed}</span>
            <span className={styles.profileStatLabel}>Confirmed</span>
          </div>
          <div className={styles.profileStatItem}>
            <span className={styles.profileStatNum} style={{ color: '#6B7280' }}>{statusCounts.completed}</span>
            <span className={styles.profileStatLabel}>Completed</span>
          </div>
          <div className={styles.profileStatItem}>
            <span className={styles.profileStatNum} style={{ color: '#C0392B' }}>{statusCounts.cancelled}</span>
            <span className={styles.profileStatLabel}>Cancelled</span>
          </div>
        </div>
      </div>

      <h3 className={styles.profileOrdersTitle}>Order History</h3>

      {profile.orders.length === 0 ? (
        <p className={styles.emptyText}>No orders from this customer.</p>
      ) : (
        <div className={styles.orderList}>
          {profile.orders.map((order) => (
            <div key={order._id} className={styles.profileOrderCard}>
              <div className={styles.profileOrderHeader}>
                <div>
                  <span className={styles.miniOrderId}>#{order._id.slice(-6).toUpperCase()}</span>
                  <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                </div>
                <span className={styles.statusBadge} style={{ background: STATUS_COLORS[order.status] }}>
                  {order.status}
                </span>
              </div>
              <div className={styles.profileOrderDetails}>
                <div>
                  <strong>Quantity:</strong> {order.quantity}{order.quantityOther ? ` (${order.quantityOther})` : ''}
                </div>
                <div>
                  <strong>Flavors:</strong> {order.flavors.join(', ')}{order.flavorOther ? ` (Other: ${order.flavorOther})` : ''}
                </div>
                <div>
                  <strong>Payment:</strong> {order.paymentMethod}
                </div>
                <div>
                  <strong>Pickup:</strong> {order.pickupDate}
                </div>
                {order.specialRequests && (
                  <div>
                    <strong>Special Requests:</strong> {order.specialRequests}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ===================== PAGES PANEL ===================== */

const PagesPanel = () => {
  const [activePage, setActivePage] = useState('about');

  return (
    <>
      <div className={styles.productHeader}>
        <h2>Edit Pages</h2>
        <div className={styles.pageSubTabs}>
          <button
            className={`${styles.filterBtn} ${activePage === 'about' ? styles.filterActive : ''}`}
            onClick={() => setActivePage('about')}
          >
            About Page
          </button>
          <button
            className={`${styles.filterBtn} ${activePage === 'preorder' ? styles.filterActive : ''}`}
            onClick={() => setActivePage('preorder')}
          >
            Pre-Order Page
          </button>
        </div>
      </div>

      {activePage === 'about' ? <AboutEditor /> : <PreOrderEditor />}
    </>
  );
};

/* ===================== ABOUT EDITOR ===================== */

const AboutEditor = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/site-content/about');
        setContent(data);
        if (data.image) setImagePreview(data.image);
      } catch { /* use defaults */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleChange = (field, value) => {
    setContent((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleParagraphChange = (index, value) => {
    setContent((prev) => {
      const paragraphs = [...prev.storyParagraphs];
      paragraphs[index] = value;
      return { ...prev, storyParagraphs: paragraphs };
    });
    setSaved(false);
  };

  const addParagraph = () => {
    setContent((prev) => ({
      ...prev,
      storyParagraphs: [...prev.storyParagraphs, ''],
    }));
  };

  const removeParagraph = (index) => {
    setContent((prev) => ({
      ...prev,
      storyParagraphs: prev.storyParagraphs.filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const handleValueChange = (index, field, value) => {
    setContent((prev) => {
      const values = [...prev.values];
      values[index] = { ...values[index], [field]: value };
      return { ...prev, values };
    });
    setSaved(false);
  };

  const addValue = () => {
    setContent((prev) => ({
      ...prev,
      values: [...prev.values, { icon: '⭐', title: '', description: '' }],
    }));
  };

  const removeValue = (index) => {
    setContent((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setSaved(false);
    }
  };

  const removeImage = async () => {
    try {
      await api.delete('/site-content/about/image');
    } catch { /* ignore */ }
    setImageFile(null);
    setImagePreview(null);
    setContent((prev) => ({ ...prev, image: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('content', JSON.stringify(content));
      if (imageFile) formData.append('image', imageFile);
      await api.put('/site-content/about', formData);
      setSaved(true);
      setImageFile(null);
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading || !content) return <p className={styles.loadingText}>Loading...</p>;

  return (
    <div className={styles.pageEditor}>
      {/* Header Section */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Page Header</h3>
        <div className={styles.formField}>
          <label>Heading</label>
          <input type="text" value={content.heading} onChange={(e) => handleChange('heading', e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>Subtitle</label>
          <input type="text" value={content.subtitle} onChange={(e) => handleChange('subtitle', e.target.value)} />
        </div>
      </div>

      {/* Image */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>About Image (optional)</h3>
        <p className={styles.editorHint}>Add a photo of yourself or your team</p>
        <div className={styles.aboutImageUpload}>
          <div className={styles.aboutImagePreview} onClick={() => fileInputRef.current?.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="About" />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <FaImage size={32} />
                <span>Click to upload</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          {imagePreview && (
            <button type="button" className={styles.removeImgBtn} onClick={removeImage}>
              Remove Image
            </button>
          )}
        </div>
      </div>

      {/* Story */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Story Section</h3>
        <div className={styles.formField}>
          <label>Section Title</label>
          <input type="text" value={content.storyTitle} onChange={(e) => handleChange('storyTitle', e.target.value)} />
        </div>
        {content.storyParagraphs.map((p, i) => (
          <div key={i} className={styles.editableRow}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label>Paragraph {i + 1}</label>
              <textarea rows="3" value={p} onChange={(e) => handleParagraphChange(i, e.target.value)} />
            </div>
            {content.storyParagraphs.length > 1 && (
              <button className={styles.removeRowBtn} onClick={() => removeParagraph(i)} title="Remove"><FaTimes /></button>
            )}
          </div>
        ))}
        <button className={styles.addRowBtn} onClick={addParagraph}><FaPlus /> Add Paragraph</button>
      </div>

      {/* Values */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Values / Features</h3>
        <div className={styles.formField}>
          <label>Section Title</label>
          <input type="text" value={content.valuesTitle} onChange={(e) => handleChange('valuesTitle', e.target.value)} />
        </div>
        {content.values.map((v, i) => (
          <div key={i} className={styles.valueEditCard}>
            <div className={styles.valueEditRow}>
              <div className={styles.formField} style={{ flex: '0 0 60px' }}>
                <label>Icon</label>
                <input type="text" value={v.icon} onChange={(e) => handleValueChange(i, 'icon', e.target.value)} />
              </div>
              <div className={styles.formField} style={{ flex: 1 }}>
                <label>Title</label>
                <input type="text" value={v.title} onChange={(e) => handleValueChange(i, 'title', e.target.value)} />
              </div>
              {content.values.length > 1 && (
                <button className={styles.removeRowBtn} onClick={() => removeValue(i)} title="Remove"><FaTimes /></button>
              )}
            </div>
            <div className={styles.formField}>
              <label>Description</label>
              <textarea rows="2" value={v.description} onChange={(e) => handleValueChange(i, 'description', e.target.value)} />
            </div>
          </div>
        ))}
        <button className={styles.addRowBtn} onClick={addValue}><FaPlus /> Add Value</button>
      </div>

      {/* CTA */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Call to Action</h3>
        <div className={styles.formField}>
          <label>CTA Title</label>
          <input type="text" value={content.ctaTitle} onChange={(e) => handleChange('ctaTitle', e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>CTA Subtitle</label>
          <input type="text" value={content.ctaSubtitle} onChange={(e) => handleChange('ctaSubtitle', e.target.value)} />
        </div>
      </div>

      <div className={styles.editorActions}>
        {saved && <span className={styles.savedLabel}>Changes saved!</span>}
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

/* ===================== PREORDER EDITOR ===================== */

const PreOrderEditor = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/site-content/preorder');
        setContent(data);
      } catch { /* use defaults */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleChange = (field, value) => {
    setContent((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleArrayChange = (field, index, value) => {
    setContent((prev) => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
    setSaved(false);
  };

  const addArrayItem = (field, defaultValue = '') => {
    setContent((prev) => ({
      ...prev,
      [field]: [...prev[field], defaultValue],
    }));
  };

  const removeArrayItem = (field, index) => {
    setContent((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('content', JSON.stringify(content));
      await api.put('/site-content/preorder', formData);
      setSaved(true);
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading || !content) return <p className={styles.loadingText}>Loading...</p>;

  return (
    <div className={styles.pageEditor}>
      {/* Header */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Page Header</h3>
        <div className={styles.formField}>
          <label>Heading</label>
          <input type="text" value={content.heading} onChange={(e) => handleChange('heading', e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>Subtitle</label>
          <input type="text" value={content.subtitle} onChange={(e) => handleChange('subtitle', e.target.value)} />
        </div>
      </div>

      {/* Intro */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Intro Text</h3>
        {content.introParagraphs.map((p, i) => (
          <div key={i} className={styles.editableRow}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label>Paragraph {i + 1}</label>
              <textarea rows="3" value={p} onChange={(e) => handleArrayChange('introParagraphs', i, e.target.value)} />
            </div>
            {content.introParagraphs.length > 1 && (
              <button className={styles.removeRowBtn} onClick={() => removeArrayItem('introParagraphs', i)} title="Remove"><FaTimes /></button>
            )}
          </div>
        ))}
        <button className={styles.addRowBtn} onClick={() => addArrayItem('introParagraphs')}><FaPlus /> Add Paragraph</button>
      </div>

      {/* Quantities / Pricing */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Quantities / Pricing</h3>
        <p className={styles.editorHint}>These appear as radio options on the form (plus an "Other" option)</p>
        {content.quantities.map((q, i) => (
          <div key={i} className={styles.editableRow}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <input type="text" value={q} onChange={(e) => handleArrayChange('quantities', i, e.target.value)} />
            </div>
            {content.quantities.length > 1 && (
              <button className={styles.removeRowBtn} onClick={() => removeArrayItem('quantities', i)} title="Remove"><FaTimes /></button>
            )}
          </div>
        ))}
        <button className={styles.addRowBtn} onClick={() => addArrayItem('quantities')}><FaPlus /> Add Option</button>
      </div>

      {/* Payment Methods */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Payment Methods</h3>
        {content.paymentMethods.map((m, i) => (
          <div key={i} className={styles.editableRow}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <input type="text" value={m} onChange={(e) => handleArrayChange('paymentMethods', i, e.target.value)} />
            </div>
            {content.paymentMethods.length > 1 && (
              <button className={styles.removeRowBtn} onClick={() => removeArrayItem('paymentMethods', i)} title="Remove"><FaTimes /></button>
            )}
          </div>
        ))}
        <button className={styles.addRowBtn} onClick={() => addArrayItem('paymentMethods')}><FaPlus /> Add Method</button>
      </div>

      {/* Pickup Dates */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Pickup Dates</h3>
        {content.pickupDates.map((d, i) => (
          <div key={i} className={styles.editableRow}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <input type="text" value={d} onChange={(e) => handleArrayChange('pickupDates', i, e.target.value)} />
            </div>
            {content.pickupDates.length > 1 && (
              <button className={styles.removeRowBtn} onClick={() => removeArrayItem('pickupDates', i)} title="Remove"><FaTimes /></button>
            )}
          </div>
        ))}
        <button className={styles.addRowBtn} onClick={() => addArrayItem('pickupDates')}><FaPlus /> Add Date</button>
      </div>

      {/* Terms */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Terms & Conditions</h3>
        {content.terms.map((t, i) => (
          <div key={i} className={styles.editableRow}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label>Term {i + 1}</label>
              <textarea rows="2" value={t} onChange={(e) => handleArrayChange('terms', i, e.target.value)} />
            </div>
            {content.terms.length > 1 && (
              <button className={styles.removeRowBtn} onClick={() => removeArrayItem('terms', i)} title="Remove"><FaTimes /></button>
            )}
          </div>
        ))}
        <button className={styles.addRowBtn} onClick={() => addArrayItem('terms')}><FaPlus /> Add Term</button>
      </div>

      {/* Success Message */}
      <div className={styles.editorSection}>
        <h3 className={styles.editorSectionTitle}>Success Message</h3>
        <div className={styles.formField}>
          <label>Title</label>
          <input type="text" value={content.successTitle} onChange={(e) => handleChange('successTitle', e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>Message</label>
          <textarea rows="2" value={content.successMessage} onChange={(e) => handleChange('successMessage', e.target.value)} />
        </div>
        <div className={styles.formField}>
          <label>Note</label>
          <input type="text" value={content.successNote} onChange={(e) => handleChange('successNote', e.target.value)} />
        </div>
      </div>

      <div className={styles.editorActions}>
        {saved && <span className={styles.savedLabel}>Changes saved!</span>}
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
