import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CustomerContext = createContext();

const CUSTOMER_TOKEN_KEY = 'daundulce_customer_token';

export const CustomerProvider = ({ children }) => {
  const [customerToken, setCustomerToken] = useState(localStorage.getItem(CUSTOMER_TOKEN_KEY));
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!customerToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/customers/verify', {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        setCustomer(data.customer);
      } catch {
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        setCustomerToken(null);
        setCustomer(null);
      }
      setLoading(false);
    };

    verifyToken();
  }, [customerToken]);

  const login = async (email, password, rememberMe = false) => {
    const { data } = await api.post('/customers/login', { email, password, rememberMe });
    localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
    setCustomerToken(data.token);
    setCustomer(data.customer);
    return data;
  };

  const register = async (name, email, phone, password) => {
    const { data } = await api.post('/customers/register', { name, email, phone, password });
    localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
    setCustomerToken(data.token);
    setCustomer(data.customer);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    setCustomerToken(null);
    setCustomer(null);
  };

  return (
    <CustomerContext.Provider value={{ customerToken, customer, loading, login, register, logout }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => useContext(CustomerContext);
