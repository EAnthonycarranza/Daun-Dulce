import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const ThemeProvider = ({ children }) => {
  // mode can be 'light', 'dark', or 'system'
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('daundulce_theme') || 'system';
  });

  const resolvedTheme = mode === 'system' ? getSystemTheme() : mode;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    localStorage.setItem('daundulce_theme', mode);
  }, [mode, resolvedTheme]);

  // Listen for device preference changes when in system mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        document.documentElement.setAttribute('data-theme', getSystemTheme());
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Cycles: system → light → dark → system
  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
