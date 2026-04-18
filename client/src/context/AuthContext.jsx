import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('daundulce_token'));
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/verify');
        setAdmin({ username: data.username });
      } catch {
        localStorage.removeItem('daundulce_token');
        setToken(null);
        setAdmin(null);
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (username, password, rememberMe = false) => {
    const { data } = await api.post('/auth/login', { username, password, rememberMe });
    localStorage.setItem('daundulce_token', data.token);
    setToken(data.token);
    setAdmin({ username: data.username });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('daundulce_token');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ token, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
