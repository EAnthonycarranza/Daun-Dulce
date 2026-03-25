import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Contact from './pages/Contact';
import PreOrder from './pages/PreOrder';
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import MyOrders from './pages/MyOrders';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ConfirmOrder from './pages/ConfirmOrder';
import TrackOrder from './pages/TrackOrder';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

const CustomerProtectedRoute = ({ children }) => {
  const { customerToken, loading } = useCustomer();

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (!customerToken) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <ThemeProvider>
    <AuthProvider>
      <CustomerProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes with layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pre-order" element={<PreOrder />} />
              <Route path="/confirm-order/:token" element={<ConfirmOrder />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/login" element={<CustomerLogin />} />
              <Route path="/register" element={<CustomerRegister />} />
              <Route
                path="/my-orders"
                element={
                  <CustomerProtectedRoute>
                    <MyOrders />
                  </CustomerProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin routes without public layout */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </CustomerProvider>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
