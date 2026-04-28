import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaPlus, FaEdit, FaTrash, FaStar, FaRegStar, FaImage, FaTimes, FaUser,
  FaEnvelope, FaPhone, FaSun, FaMoon, FaDesktop, FaArrowLeft, FaUndo,
  FaPaperPlane, FaCheckCircle, FaTimesCircle,
  FaClipboardList, FaCookieBite, FaUsers, FaFileAlt, FaBars, FaSignOutAlt,
  FaChartLine, FaSearch, FaFileInvoiceDollar,
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import logo from '../assets/images/DaunDulce_Logo.png';
import MonthlyChart from '../components/ui/MonthlyChart';
import styles from './AdminDashboard.module.css';
import eventStyles from './Events.module.css';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_COLORS = {
  pending: '#D4A017',
  confirmed: '#4A7C59',
  completed: '#6B7280',
  cancelled: '#C0392B',
};

const NAV_ITEMS = [
  { key: 'insights', label: 'Insights', icon: FaChartLine, description: 'Monthly trends across orders & quotes' },
  { key: 'orders', label: 'Pre-Orders', icon: FaClipboardList, description: 'Manage and track customer pre-orders' },
  { key: 'quotes', label: 'Event Quotes', icon: FaFileInvoiceDollar, description: 'Review and respond to event quote requests' },
  { key: 'products', label: 'Menu Items', icon: FaCookieBite, description: 'Manage your cookie catalog and availability' },
  { key: 'events', label: 'Pop-Up Events', icon: FaCalendarAlt, description: 'Manage upcoming markets and appearances' },
  { key: 'customers', label: 'Customers', icon: FaUsers, description: 'Customer directory and order history' },
  { key: 'pages', label: 'Site Content', icon: FaFileAlt, description: 'Update pricing, flavors, and website text' },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [customerProfileId, setCustomerProfileId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const current = activeTab === 'customer-profile'
    ? NAV_ITEMS.find((n) => n.key === 'customers')
    : NAV_ITEMS.find((n) => n.key === activeTab);

  const goTo = (key) => {
    if (key === 'customers') setCustomerProfileId(null);
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const themeIcon = mode === 'system' ? <FaDesktop /> : mode === 'light' ? <FaSun /> : <FaMoon />;
  const themeLabel = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';

  return (
    <div className={styles.dashboard}>
      {sidebarOpen && (
        <div className={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <img src={logo} alt="Daun Dulce" className={styles.brandLogo} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>Daun Dulce</span>
            <span className={styles.brandSub}>Admin Console</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin navigation">
          <span className={styles.navLabel}>Workspace</span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key
              || (item.key === 'customers' && activeTab === 'customer-profile');
            return (
              <button
                key={item.key}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => goTo(item.key)}
              >
                <span className={styles.navIcon}><Icon /></span>
                <span className={styles.navText}>{item.label}</span>
                {isActive && <span className={styles.navIndicator} aria-hidden />}
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            onClick={toggleTheme}
            className={styles.sidebarAction}
            aria-label="Toggle theme"
            title={themeLabel}
          >
            <span className={styles.navIcon}>{themeIcon}</span>
            <span className={styles.navText}>Theme · {themeLabel}</span>
          </button>
          <button onClick={handleLogout} className={`${styles.sidebarAction} ${styles.sidebarLogout}`}>
            <span className={styles.navIcon}><FaSignOutAlt /></span>
            <span className={styles.navText}>Log Out</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <FaBars />
          </button>
          <div className={styles.topbarTitle}>
            <span className={styles.breadcrumb}>
              <FaChartLine /> Dashboard
            </span>
            <h1>{current?.label || 'Dashboard'}</h1>
            <p>{current?.description}</p>
          </div>
          <div className={styles.topbarActions}>
            <button
              onClick={toggleTheme}
              className={styles.iconBtn}
              aria-label="Toggle theme"
              title={themeLabel}
            >
              {themeIcon}
            </button>
            <button onClick={handleLogout} className={styles.logoutChip}>
              <FaSignOutAlt /> <span>Log Out</span>
            </button>
          </div>
        </header>

        <div className={styles.content}>
          {activeTab === 'insights' && <InsightsPanel />}
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'quotes' && <QuotesPanel />}
          {activeTab === 'products' && <ProductsPanel />}
          {activeTab === 'events' && <EventsPanel />}
          {activeTab === 'customers' && <CustomersPanel onOpenProfile={openCustomerProfile} />}
          {activeTab === 'customer-profile' && customerProfileId && (
            <CustomerProfile customerId={customerProfileId} onBack={closeCustomerProfile} />
          )}
          {activeTab === 'pages' && <PagesPanel />}
        </div>
      </div>
    </div>
  );
};

/* ===================== COMMON COMPONENTS ===================== */

const DeleteModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Yes, Delete', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIcon}>🗑️</div>
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalText}>{message}</p>
        <div className={styles.modalActions}>
          <button className={styles.modalKeepBtn} onClick={onCancel}>{cancelText}</button>
          <button className={styles.modalCancelBtn} onClick={onConfirm}>{confirmText}</button>
        </div>
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

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, { total: 0 });

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FaSearch className={styles.searchIcon} aria-hidden />
          <input
            type="text"
            placeholder="Search by name, contact, or Order #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
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
          <span className={styles.statNum}>{counts.total}</span>
          <span className={styles.statLabel}>Total Orders</span>
        </div>
        {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
          <div key={s} className={styles.statCard}>
            <span className={styles.statNum}>{counts[s] || 0}</span>
            <span className={styles.statLabel}>{s}</span>
          </div>
        ))}
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

      <DeleteModal
        isOpen={deleteModal.open}
        title="Delete Order?"
        message={<>Are you sure you want to permanently delete the order for <strong>{deleteModal.customerName}</strong>? This action cannot be undone and all order data will be lost.</>}
        confirmText="Yes, Delete Order"
        cancelText="Keep Order"
        onConfirm={() => {
          deleteOrder(deleteModal.orderId);
          setDeleteModal({ open: false, orderId: null, customerName: '' });
        }}
        onCancel={() => setDeleteModal({ open: false, orderId: null, customerName: '' })}
      />
    </>
  );
};

/* ===================== PRODUCTS PANEL ===================== */

const ProductsPanel = () => {
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCookie, setEditingCookie] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

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
                  <button className={styles.deleteBtn} onClick={() => setDeleteModal({ open: true, id: cookie._id, name: cookie.name })}>
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <DeleteModal
        isOpen={deleteModal.open}
        title="Delete Cookie?"
        message={<>Are you sure you want to delete <strong>{deleteModal.name}</strong>? This will permanently remove it from your menu catalog.</>}
        confirmText="Yes, Delete Cookie"
        onConfirm={() => {
          deleteCookie(deleteModal.id);
          setDeleteModal({ open: false, id: null, name: '' });
        }}
        onCancel={() => setDeleteModal({ open: false, id: null, name: '' })}
      />
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

/* ===================== EVENTS PANEL ===================== */

const EventsPanel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events/admin');
      setEvents(data);
    } catch {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const deleteEvent = async (id) => {
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch { /* ignore */ }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEvent(null);
    fetchEvents();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (showForm) {
    return <EventForm event={editingEvent} onClose={handleFormClose} />;
  }

  return (
    <>
      <div className={styles.productHeader}>
        <h2>Manage Events</h2>
        <button className={styles.addBtn} onClick={handleAdd}>
          <FaPlus /> Add Event
        </button>
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading events...</p>
      ) : events.length === 0 ? (
        <p className={styles.emptyText}>No events yet. Add your first one!</p>
      ) : (
        <div className={styles.adminEventList}>
          {events.map((event) => (
            <div key={event._id} className={styles.adminEventItem}>
              {/* Event Card Preview (Matches regular user view) */}
              <div className={eventStyles.eventCard}>
                {event.image && (
                  <div className={eventStyles.imageWrap}>
                    <img src={event.image} alt={event.title} />
                  </div>
                )}
                <div className={eventStyles.contentWrap}>
                  <div className={eventStyles.eventMeta}>
                    <div className={eventStyles.metaRow}>
                      <span className={eventStyles.metaIcon}><FaCalendarAlt /></span>
                      <span className={eventStyles.eventDate}>{formatDate(event.date)}</span>
                    </div>
                    <div className={eventStyles.metaRow}>
                      <span className={eventStyles.metaIcon}><FaClock /></span>
                      <span className={eventStyles.eventTime}>{event.time || 'TBA'}</span>
                    </div>
                    <div className={eventStyles.metaRow}>
                      <span className={eventStyles.metaIcon}><FaMapMarkerAlt /></span>
                      {event.googleMapsLink ? (
                        <a 
                          href={event.googleMapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={eventStyles.locationLink}
                        >
                          {event.location}
                        </a>
                      ) : (
                        <span className={eventStyles.eventLocation}>{event.location}</span>
                      )}
                    </div>
                  </div>
                  <h3 className={eventStyles.eventTitle}>{event.title}</h3>
                  <p className={eventStyles.eventDesc}>{event.description}</p>
                  {event.link && (
                    <a 
                      href={event.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={eventStyles.eventLink}
                    >
                      Learn More <FaArrowRight />
                    </a>
                  )}
                </div>
              </div>

              {/* Admin Actions Bar */}
              <div className={styles.adminCardActions}>
                <button className={styles.editBtn} onClick={() => handleEdit(event)}>
                  <FaEdit /> Edit Event
                </button>
                <button className={styles.deleteBtn} onClick={() => setDeleteModal({ open: true, id: event._id, title: event.title })}>
                  <FaTrash /> Delete Event
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <DeleteModal
        isOpen={deleteModal.open}
        title="Delete Event?"
        message={<>Are you sure you want to delete <strong>{deleteModal.title}</strong>? This will permanently remove it from your upcoming events list.</>}
        confirmText="Yes, Delete Event"
        onConfirm={() => {
          deleteEvent(deleteModal.id);
          setDeleteModal({ open: false, id: null, title: '' });
        }}
        onCancel={() => setDeleteModal({ open: false, id: null, title: '' })}
      />
    </>
  );
};

/* ===================== EVENT FORM ===================== */

const EventForm = ({ event, onClose }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(event?.date ? new Date(event.date).toISOString().split('T')[0] : '');
  const [location, setLocation] = useState(event?.location || '');
  const [time, setTime] = useState(event?.time || '');
  const [link, setLink] = useState(event?.link || '');
  const [googleMapsLink, setGoogleMapsLink] = useState(event?.googleMapsLink || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(event?.image || null);
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
    if (event?._id && event.image) {
      try {
        await api.delete(`/events/${event._id}/image`);
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
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('location', location);
      formData.append('time', time);
      formData.append('link', link);
      formData.append('googleMapsLink', googleMapsLink);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (event?._id) {
        await api.put(`/events/${event._id}`, formData);
      } else {
        await api.post('/events', formData);
      }

      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event');
    }
    setSaving(false);
  };

  return (
    <div className={styles.formWrapper}>
      <div className={styles.formHeader}>
        <h2>{event ? 'Edit Event' : 'Add New Event'}</h2>
        <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
      </div>

      {error && <div className={styles.formError}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.cookieForm}>
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
            <label>Event Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className={styles.formField}>
            <label>Description *</label>
            <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label>Location *</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label>Time (e.g. 6 PM - 9 PM) *</label>
              <input type="text" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className={styles.formField}>
            <label>Learn More Link (optional)</label>
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://instagram.com/..." />
          </div>

          <div className={styles.formField}>
            <label>Google Maps Link (optional)</label>
            <input type="url" value={googleMapsLink} onChange={(e) => setGoogleMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelFormBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : event ? 'Update Event' : 'Add Event'}
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
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

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

  const deleteCustomer = async (id) => {
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className={styles.productHeader}>
        <h2>Customers</h2>
        <div className={styles.searchWrap}>
          <FaSearch className={styles.searchIcon} aria-hidden />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
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
                  <button 
                    className={styles.deleteBtn} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteModal({ open: true, id: cust._id, name: cust.name });
                    }}
                    style={{ marginLeft: '12px', padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <DeleteModal
        isOpen={deleteModal.open}
        title="Delete Customer?"
        message={<>Are you sure you want to delete <strong>{deleteModal.name}</strong>? This will permanently remove their profile and un-link their past orders.</>}
        confirmText="Yes, Delete Customer"
        onConfirm={() => {
          deleteCustomer(deleteModal.id);
          setDeleteModal({ open: false, id: null, name: '' });
        }}
        onCancel={() => setDeleteModal({ open: false, id: null, name: '' })}
      />
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
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', index: null });
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
            <button type="button" className={styles.removeImgBtn} onClick={() => setDeleteModal({ open: true, type: 'image' })}>
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
              <button className={styles.removeRowBtn} onClick={() => setDeleteModal({ open: true, type: 'paragraph', index: i })} title="Remove"><FaTimes /></button>
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
                <button className={styles.removeRowBtn} onClick={() => setDeleteModal({ open: true, type: 'value', index: i })} title="Remove"><FaTimes /></button>
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
    <DeleteModal
        isOpen={deleteModal.open}
        title={deleteModal.type === 'image' ? 'Remove Image?' : 'Remove Item?'}
        message={
          deleteModal.type === 'paragraph' ? 'Are you sure you want to remove this paragraph?' :
          deleteModal.type === 'value' ? 'Are you sure you want to remove this value/feature?' :
          'Are you sure you want to remove this image?'
        }
        confirmText="Yes, Remove"
        onConfirm={() => {
          if (deleteModal.type === 'paragraph') removeParagraph(deleteModal.index);
          else if (deleteModal.type === 'value') removeValue(deleteModal.index);
          else if (deleteModal.type === 'image') removeImage();
          setDeleteModal({ open: false, type: '', index: null });
        }}
        onCancel={() => setDeleteModal({ open: false, type: '', index: null })}
      />
    </div>
  );
};

/* ===================== PREORDER EDITOR ===================== */

const PreOrderEditor = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, field: '', index: null });

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
              <button className={styles.removeRowBtn} onClick={() => setDeleteModal({ open: true, field: 'introParagraphs', index: i })} title="Remove"><FaTimes /></button>
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
              <button className={styles.removeRowBtn} onClick={() => setDeleteModal({ open: true, field: 'quantities', index: i })} title="Remove"><FaTimes /></button>
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
              <button className={styles.removeRowBtn} onClick={() => setDeleteModal({ open: true, field: 'paymentMethods', index: i })} title="Remove"><FaTimes /></button>
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
              <button className={styles.removeRowBtn} onClick={() => setDeleteModal({ open: true, field: 'pickupDates', index: i })} title="Remove"><FaTimes /></button>
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
              <button className={styles.removeRowBtn} onClick={() => setDeleteModal({ open: true, field: 'terms', index: i })} title="Remove"><FaTimes /></button>
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
      <DeleteModal
        isOpen={deleteModal.open}
        title="Remove Item?"
        message={`Are you sure you want to remove this ${
          deleteModal.field === 'introParagraphs' ? 'paragraph' :
          deleteModal.field === 'quantities' ? 'pricing option' :
          deleteModal.field === 'paymentMethods' ? 'payment method' :
          deleteModal.field === 'pickupDates' ? 'pickup date' :
          'term'
        }?`}
        confirmText="Yes, Remove"
        onConfirm={() => {
          removeArrayItem(deleteModal.field, deleteModal.index);
          setDeleteModal({ open: false, field: '', index: null });
        }}
        onCancel={() => setDeleteModal({ open: false, field: '', index: null })}
      />
    </div>
  );
};

/* ===================== QUOTES PANEL ===================== */

const QUOTE_STATUSES = ['all', 'new', 'quoted', 'accepted', 'declined', 'completed', 'archived'];

const QUOTE_STATUS_COLORS = {
  new: '#D4A017',
  quoted: '#3B82F6',
  accepted: '#4A7C59',
  declined: '#C0392B',
  completed: '#6B7280',
  archived: '#9CA3AF',
};

const QUOTE_EVENT_LABELS = {
  wedding: 'Wedding',
  corporate: 'Corporate',
  fundraiser: 'Fundraiser',
  birthday: 'Birthday',
  'baby-shower': 'Baby Shower',
  holiday: 'Holiday',
  other: 'Other',
};

const QuotesPanel = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [quoteForm, setQuoteForm] = useState({});
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, quoteId: null, customerName: '' });

  const fetchQuotes = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await api.get('/quotes', { params });
      setQuotes(data);
    } catch {
      setQuotes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 20000);
    return () => clearInterval(interval);
  }, [statusFilter, search]);

  const toggleExpand = (quote) => {
    if (expandedId === quote._id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(quote._id);
    setQuoteForm({
      items: quote.quote?.items?.length ? [...quote.quote.items] : [{ name: 'Custom Cookies', unitLabel: 'cookie', quantity: quote.guestCount || 1, pricePerUnit: '' }],
      isItemized: quote.quote?.isItemized || false,
      fees: quote.quote?.fees || 0,
      notes: quote.quote?.notes || '',
      validUntil: quote.quote?.validUntil || '',
    });
    setMessage('');
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/quotes/${id}/status`, { status });
      fetchQuotes();
    } catch { /* ignore */ }
  };

  const sendQuote = async (id) => {
    setSending(true);
    setMessage('');
    try {
      const res = await api.post(`/quotes/${id}/send-quote`, quoteForm);
      setMessage(res.data.emailSent ? 'Quote sent to customer.' : 'Saved, but email failed.');
      fetchQuotes();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send quote.');
    } finally {
      setSending(false);
    }
  };

  const deleteQuote = async (id) => {
    try {
      await api.delete(`/quotes/${id}`);
      fetchQuotes();
      setExpandedId(null);
    } catch { /* ignore */ }
  };

  const money = (n) => (typeof n === 'number' && !isNaN(n) ? `$${n.toFixed(2)}` : '—');

  const subtotal = quoteForm.items?.reduce((acc, item) => acc + (Number(item.pricePerUnit) * Number(item.quantity) || 0), 0) || 0;
  const total = subtotal + Number(quoteForm.fees || 0);
  const isValidToSubmit = quoteForm.items?.length > 0 && quoteForm.items.every(i => (!quoteForm.isItemized || i.name) && Number(i.pricePerUnit) > 0 && Number(i.quantity) > 0);

  const counts = quotes.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FaSearch className={styles.searchIcon} aria-hidden />
          <input
            type="text"
            placeholder="Search by name, email, org, event…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.statusFilters}>
          {QUOTE_STATUSES.map((s) => (
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
          <span className={styles.statNum}>{quotes.length}</span>
          <span className={styles.statLabel}>
            {statusFilter === 'all' ? 'Total Quotes' : `${statusFilter} Quotes`}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{counts.new || 0}</span>
          <span className={styles.statLabel}>New Requests</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{counts.quoted || 0}</span>
          <span className={styles.statLabel}>Awaiting Response</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{counts.accepted || 0}</span>
          <span className={styles.statLabel}>Accepted</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{counts.declined || 0}</span>
          <span className={styles.statLabel}>Declined</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{counts.confirmed || 0}</span>
          <span className={styles.statLabel}>Confirmed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{counts.completed || 0}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{counts.cancelled || 0}</span>
          <span className={styles.statLabel}>Cancelled</span>
        </div>
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading quotes...</p>
      ) : quotes.length === 0 ? (
        <p className={styles.emptyText}>No quote requests found.</p>
      ) : (
        <div className={styles.orderList}>
          {quotes.map((quote) => (
            <div key={quote._id} className={styles.orderCard}>
              <div className={styles.orderHeader} onClick={() => toggleExpand(quote)}>
                <div className={styles.orderInfo}>
                  <h3>
                    <span className={styles.orderIdInline}>
                      {QUOTE_EVENT_LABELS[quote.eventType] || 'Event'}
                    </span>{' '}
                    {quote.customerName}
                    {quote.organization ? ` · ${quote.organization}` : ''}
                  </h3>
                  <span className={styles.orderContact}>
                    {quote.contactEmail} | {quote.contactPhone} · {quote.guestCount} guests
                  </span>
                </div>
                <div className={styles.orderMeta}>
                  <span
                    className={styles.statusBadge}
                    style={{ background: QUOTE_STATUS_COLORS[quote.status] }}
                  >
                    {quote.status}
                  </span>
                  <span className={styles.orderDate}>{formatDate(quote.createdAt)}</span>
                </div>
              </div>

              {expandedId === quote._id && (
                <div className={styles.orderDetails}>
                  <div className={styles.detailGrid}>
                    <div>
                      <strong>Name:</strong>
                      <p>{quote.customerName}</p>
                    </div>
                    <div>
                      <strong>Email:</strong>
                      <p><a href={`mailto:${quote.contactEmail}`}>{quote.contactEmail}</a></p>
                    </div>
                    <div>
                      <strong>Phone:</strong>
                      <p><a href={`tel:${quote.contactPhone}`}>{quote.contactPhone}</a></p>
                    </div>
                    {quote.organization && (
                      <div>
                        <strong>Organization:</strong>
                        <p>{quote.organization}</p>
                      </div>
                    )}
                    <div>
                      <strong>Event:</strong>
                      <p>{QUOTE_EVENT_LABELS[quote.eventType]}{quote.eventTypeOther ? ` — ${quote.eventTypeOther}` : ''}</p>
                    </div>
                    {quote.eventName && (
                      <div>
                        <strong>Event Name:</strong>
                        <p>{quote.eventName}</p>
                      </div>
                    )}
                    <div>
                      <strong>Date:</strong>
                      <p>{quote.eventDate || '—'}{quote.dateFlexible ? ' (flexible)' : ''}</p>
                    </div>
                    <div>
                      <strong>Guests:</strong>
                      <p>{quote.guestCount}</p>
                    </div>
                    <div>
                      <strong>Fulfillment:</strong>
                      <p style={{ textTransform: 'capitalize' }}>{quote.fulfillment}</p>
                    </div>
                    {quote.budgetRange && (
                      <div>
                        <strong>Budget:</strong>
                        <p>{quote.budgetRange}</p>
                      </div>
                    )}
                    {quote.flavors?.length > 0 && (
                      <div className={styles.detailFull}>
                        <strong>Flavors:</strong>
                        <p>{quote.flavors.join(', ')}</p>
                      </div>
                    )}
                    {quote.flavorNotes && (
                      <div className={styles.detailFull}>
                        <strong>Flavor Notes:</strong>
                        <p>{quote.flavorNotes}</p>
                      </div>
                    )}
                    {quote.deliveryAddress && (
                      <div className={styles.detailFull}>
                        <strong>Delivery Address:</strong>
                        <p>{quote.deliveryAddress}</p>
                      </div>
                    )}
                    {quote.details && (
                      <div className={styles.detailFull}>
                        <strong>Details:</strong>
                        <p>{quote.details}</p>
                      </div>
                    )}
                    {quote.referral && (
                      <div>
                        <strong>Heard via:</strong>
                        <p>{quote.referral}</p>
                      </div>
                    )}
                  </div>

                  {/* Quote builder */}
                  {(quote.status === 'new' || quote.status === 'quoted') && (
                    <div className={styles.quoteBuilderCard}>
                      <h4 className={styles.quoteBuilderHeader}>
                        {quote.status === 'quoted' ? 'Update Quote' : 'Build Quote'}
                      </h4>
                      <div className={styles.modeToggle}>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${!quoteForm.isItemized ? styles.modeBtnActive : ''}`}
                          onClick={() => setQuoteForm({ ...quoteForm, isItemized: false })}
                        >
                          Simple Quote
                        </button>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${quoteForm.isItemized ? styles.modeBtnActive : ''}`}
                          onClick={() => setQuoteForm({ ...quoteForm, isItemized: true })}
                        >
                          Advanced (Itemized)
                        </button>
                      </div>

                      {quoteForm.isItemized ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                          {quoteForm.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', background: 'var(--color-ivory)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                              <div style={{ flex: '2 1 160px' }}>
                                <strong>Item Name</strong>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    const newItems = [...quoteForm.items];
                                    newItems[idx].name = e.target.value;
                                    setQuoteForm({ ...quoteForm, items: newItems });
                                  }}
                                  className={styles.quoteBuilderInput}
                                  placeholder="e.g. Custom Cookies"
                                />
                              </div>
                              <div style={{ flex: '1 1 80px' }}>
                                <strong>Price ($)</strong>
                                <input
                                  type="number" step="0.01" min="0"
                                  value={item.pricePerUnit}
                                  onChange={(e) => {
                                    const newItems = [...quoteForm.items];
                                    newItems[idx].pricePerUnit = e.target.value;
                                    setQuoteForm({ ...quoteForm, items: newItems });
                                  }}
                                  className={styles.quoteBuilderInput}
                                />
                              </div>
                              <div style={{ flex: '1 1 80px' }}>
                                <strong>Quantity</strong>
                                <input
                                  type="number" min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newItems = [...quoteForm.items];
                                    newItems[idx].quantity = e.target.value;
                                    setQuoteForm({ ...quoteForm, items: newItems });
                                  }}
                                  className={styles.quoteBuilderInput}
                                />
                              </div>
                              <div style={{ flex: '1 1 80px' }}>
                                <strong>Unit Label</strong>
                                <input
                                  type="text"
                                  value={item.unitLabel}
                                  onChange={(e) => {
                                    const newItems = [...quoteForm.items];
                                    newItems[idx].unitLabel = e.target.value;
                                    setQuoteForm({ ...quoteForm, items: newItems });
                                  }}
                                  className={styles.quoteBuilderInput}
                                  placeholder="e.g. cookie"
                                />
                              </div>
                              {quoteForm.items.length > 1 && (
                                <button
                                  type="button"
                                  className={styles.cancelBtn}
                                  style={{ marginTop: '24px', padding: '10px 12px' }}
                                  onClick={() => {
                                    const newItems = quoteForm.items.filter((_, i) => i !== idx);
                                    setQuoteForm({ ...quoteForm, items: newItems });
                                  }}
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            className={styles.completeBtn}
                            style={{ alignSelf: 'flex-start' }}
                            onClick={() => setQuoteForm({
                              ...quoteForm,
                              items: [...(quoteForm.items || []), { name: '', unitLabel: 'unit', quantity: 1, pricePerUnit: '' }]
                            })}
                          >
                            + Add Item
                          </button>
                        </div>
                      ) : (
                        <div className={styles.quoteBuilderForm}>
                          <div>
                            <strong>Price per unit ($)</strong>
                            <input
                              type="number" step="0.01" min="0"
                              value={quoteForm.items?.[0]?.pricePerUnit || ''}
                              onChange={(e) => {
                                const newItems = [...(quoteForm.items || [])];
                                if (!newItems[0]) newItems[0] = { name: 'Custom Cookies', unitLabel: 'cookie', quantity: 1, pricePerUnit: '' };
                                newItems[0].pricePerUnit = e.target.value;
                                setQuoteForm({ ...quoteForm, items: newItems });
                              }}
                              className={styles.quoteBuilderInput}
                            />
                          </div>
                          <div>
                            <strong>Quantity</strong>
                            <input
                              type="number" min="1"
                              value={quoteForm.items?.[0]?.quantity || ''}
                              onChange={(e) => {
                                const newItems = [...(quoteForm.items || [])];
                                if (!newItems[0]) newItems[0] = { name: 'Custom Cookies', unitLabel: 'cookie', quantity: 1, pricePerUnit: '' };
                                newItems[0].quantity = e.target.value;
                                setQuoteForm({ ...quoteForm, items: newItems });
                              }}
                              className={styles.quoteBuilderInput}
                            />
                          </div>
                          <div>
                            <strong>Unit Label</strong>
                            <input
                              type="text"
                              value={quoteForm.items?.[0]?.unitLabel || ''}
                              onChange={(e) => {
                                const newItems = [...(quoteForm.items || [])];
                                if (!newItems[0]) newItems[0] = { name: 'Custom Cookies', unitLabel: 'cookie', quantity: 1, pricePerUnit: '' };
                                newItems[0].unitLabel = e.target.value;
                                setQuoteForm({ ...quoteForm, items: newItems });
                              }}
                              className={styles.quoteBuilderInput}
                              placeholder="e.g. cookie"
                            />
                          </div>
                        </div>
                      )}

                      <div className={styles.quoteBuilderForm}>
                        <div>
                          <strong>Additional Fees ($)</strong>
                          <input
                            type="number" step="0.01" min="0"
                            value={quoteForm.fees}
                            onChange={(e) => setQuoteForm({ ...quoteForm, fees: e.target.value })}
                            className={styles.quoteBuilderInput}
                          />
                        </div>
                        <div>
                          <strong>Valid Until</strong>
                          <input
                            type="date"
                            value={quoteForm.validUntil}
                            onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                            className={styles.quoteBuilderInput}
                          />
                        </div>
                        <div className={styles.detailFull}>
                          <strong>Notes to customer</strong>
                          <textarea
                            rows="2"
                            value={quoteForm.notes}
                            onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                            className={styles.quoteBuilderInput}
                          />
                        </div>
                      </div>

                      <div className={styles.quoteBuilderSummary}>
                        <div>
                          <div className={styles.quoteBuilderSubtotal}>
                            Subtotal: <strong>{money(subtotal)}</strong> + Fees: <strong>{money(Number(quoteForm.fees) || 0)}</strong>
                          </div>
                          <div className={styles.quoteBuilderTotal}>
                            Total: {money(total)}
                          </div>
                        </div>
                        <button
                          className={styles.confirmBtn}
                          onClick={() => sendQuote(quote._id)}
                          disabled={sending || !isValidToSubmit}
                        >
                          <FaPaperPlane /> {sending ? 'Sending…' : quote.status === 'quoted' ? 'Resend Quote' : 'Send Quote'}
                        </button>
                      </div>

                      {message && (
                        <p style={{ marginTop: 10, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{message}</p>
                      )}
                    </div>
                  )}

                  {/* Sent-quote snapshot */}
                  {quote.quote?.items?.length > 0 && quote.status !== 'new' && (
                    <div className={styles.quoteSentSnapshot}>
                      <span className={styles.quoteSentTotal}>
                        Sent Quote: {money(quote.quote.total)}
                      </span>
                      {quote.quote.isItemized ? (
                        quote.quote.items.map((item, idx) => (
                          <p key={idx} className={styles.quoteSentDetails} style={{ margin: 0 }}>
                            {item.quantity} × {item.name} ({item.unitLabel}) @ {money(item.pricePerUnit)}
                          </p>
                        ))
                      ) : (
                        <p className={styles.quoteSentDetails} style={{ margin: 0 }}>
                          {quote.quote.items[0].quantity} × {quote.quote.items[0].unitLabel} @ {money(quote.quote.items[0].pricePerUnit)} each
                        </p>
                      )}
                      <p className={styles.quoteSentDetails} style={{ marginTop: 6, fontSize: '0.8rem', borderTop: '1px solid rgba(106, 22, 32, 0.1)', paddingTop: 6 }}>
                        {quote.quote.sentAt && `Sent ${formatDate(quote.quote.sentAt)}`}
                        {quote.quote.respondedAt && ` · ${quote.status} on ${formatDate(quote.quote.respondedAt)}`}
                      </p>
                    </div>
                  )}

                  <div className={styles.orderActions} style={{ marginTop: 20 }}>
                    {quote.status !== 'completed' && quote.status !== 'archived' && (
                      <>
                        {quote.status === 'accepted' && (
                          <button className={styles.completeBtn} onClick={() => updateStatus(quote._id, 'completed')}>
                            Mark Completed
                          </button>
                        )}
                        <button className={styles.undoBtn} onClick={() => updateStatus(quote._id, 'archived')}>
                          Archive
                        </button>
                      </>
                    )}
                    {(quote.status === 'archived' || quote.status === 'completed') && (
                      <button className={styles.undoBtn} onClick={() => updateStatus(quote._id, 'new')}>
                        <FaUndo /> Reopen
                      </button>
                    )}
                    <button className={styles.cancelBtn} onClick={() => setDeleteModal({ open: true, quoteId: quote._id, customerName: quote.customerName })}>
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <DeleteModal
        isOpen={deleteModal.open}
        title="Delete Quote?"
        message={<>Are you sure you want to delete the quote request from <strong>{deleteModal.customerName}</strong>? This action cannot be undone.</>}
        confirmText="Yes, Delete Quote"
        onConfirm={() => {
          deleteQuote(deleteModal.quoteId);
          setDeleteModal({ open: false, quoteId: null, customerName: '' });
        }}
        onCancel={() => setDeleteModal({ open: false, quoteId: null, customerName: '' })}
      />
    </>
  );
};

/* ===================== INSIGHTS PANEL ===================== */

const RANGE_OPTIONS = [
  { months: 6, label: '6 mo' },
  { months: 12, label: '12 mo' },
  { months: 24, label: '24 mo' },
];

const InsightsPanel = () => {
  const [orderStats, setOrderStats] = useState(null);
  const [quoteStats, setQuoteStats] = useState(null);
  const [range, setRange] = useState(12);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/orders/stats/monthly?months=${range}`).then((r) => r.data).catch(() => null),
      api.get(`/quotes/stats/monthly?months=${range}`).then((r) => r.data).catch(() => null),
    ]).then(([o, q]) => {
      setOrderStats(o);
      setQuoteStats(q);
      setLoading(false);
    });
  }, [range]);

  const sumKey = (series, key) => (series || []).reduce((acc, d) => acc + (d[key] || 0), 0);

  const totalOrders = sumKey(orderStats?.series, 'count');
  const totalQuotes = sumKey(quoteStats?.series, 'count');
  const totalRevenue = sumKey(quoteStats?.series, 'revenue');
  const acceptedQuotes = sumKey(quoteStats?.series, 'accepted');
  const acceptRate = totalQuotes ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

  const lastMonth = orderStats?.series?.[orderStats.series.length - 1];
  const prevMonth = orderStats?.series?.[orderStats.series.length - 2];
  const orderTrend = lastMonth && prevMonth
    ? lastMonth.count - prevMonth.count
    : 0;

  const lastQ = quoteStats?.series?.[quoteStats.series.length - 1];
  const prevQ = quoteStats?.series?.[quoteStats.series.length - 2];
  const quoteTrend = lastQ && prevQ ? lastQ.count - prevQ.count : 0;

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.statusFilters} style={{ marginLeft: 'auto' }}>
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.months}
              className={`${styles.filterBtn} ${range === r.months ? styles.filterActive : ''}`}
              onClick={() => setRange(r.months)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{totalOrders}</span>
          <span className={styles.statLabel}>
            Orders · last {range} mo
            {orderTrend !== 0 && (
              <span style={{ marginLeft: 6, color: orderTrend > 0 ? 'var(--color-success, #4A7C59)' : 'var(--color-danger, #C0392B)' }}>
                {orderTrend > 0 ? `▲ ${orderTrend}` : `▼ ${Math.abs(orderTrend)}`}
              </span>
            )}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{totalQuotes}</span>
          <span className={styles.statLabel}>
            Quotes · last {range} mo
            {quoteTrend !== 0 && (
              <span style={{ marginLeft: 6, color: quoteTrend > 0 ? 'var(--color-success, #4A7C59)' : 'var(--color-danger, #C0392B)' }}>
                {quoteTrend > 0 ? `▲ ${quoteTrend}` : `▼ ${Math.abs(quoteTrend)}`}
              </span>
            )}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{acceptRate}%</span>
          <span className={styles.statLabel}>Quote Accept Rate</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>${Math.round(totalRevenue).toLocaleString()}</span>
          <span className={styles.statLabel}>Quote Revenue · accepted</span>
        </div>
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading insights...</p>
      ) : (
        <>
          <div className={styles.orderCard} style={{ padding: 24, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-maroon)', fontWeight: 500 }}>
                  Pre-Orders by Month
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                  Stacked by status — hover bars for breakdown.
                </p>
              </div>
              <ChartLegend
                items={[
                  { label: 'Pending', color: '#C9A876' },
                  { label: 'Confirmed', color: '#4A7C59' },
                  { label: 'Completed', color: '#7A6B6B' },
                  { label: 'Cancelled', color: '#9C2A20' },
                ]}
              />
            </div>
            <MonthlyChart
              data={orderStats?.series || []}
              mode="stacked"
              stacks={['pending', 'confirmed', 'completed', 'cancelled']}
              height={240}
              yLabel="Orders"
            />
          </div>

          <div className={styles.orderCard} style={{ padding: 24, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-maroon)', fontWeight: 500 }}>
                  Quote Requests by Month
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                  How many groups, weddings, and corporate events are reaching out each month.
                </p>
              </div>
            </div>
            <MonthlyChart
              data={quoteStats?.series || []}
              valueKey="count"
              mode="line"
              height={240}
              yLabel="Requests"
            />
          </div>

          <div className={styles.orderCard} style={{ padding: 24 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-maroon)', fontWeight: 500 }}>
                Quote Revenue by Month
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                Total of accepted &amp; completed quotes.
              </p>
            </div>
            <MonthlyChart
              data={quoteStats?.series || []}
              valueKey="revenue"
              mode="bar"
              height={240}
              yLabel="USD"
              formatValue={(v) => `$${Math.round(v).toLocaleString()}`}
            />
          </div>
        </>
      )}
    </>
  );
};

const ChartLegend = ({ items }) => (
  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
    {items.map((it) => (
      <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, background: it.color, borderRadius: 2 }} />
        {it.label}
      </div>
    ))}
  </div>
);

export default AdminDashboard;
