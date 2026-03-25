import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import logo from '../assets/images/DaunDulce_Logo.png';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password, rememberMe);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginPage}>
      <button onClick={toggleTheme} className={styles.themeToggleFloat} aria-label="Toggle theme" title={mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'}>
        {mode === 'system' ? <FaDesktop /> : mode === 'light' ? <FaSun /> : <FaMoon />}
      </button>
      <div className={styles.loginCard}>
        <img src={logo} alt="Daun Dulce" className={styles.logo} />
        <h1>Admin Login</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label className={styles.rememberMe}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
