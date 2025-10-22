/**
 * AuthContext & AuthProvider
 *
 * Provides authentication state and methods to the React application using Context API.
 * Handles login, logout, token storage, auto-logout, and last login tracking.
 *
 * Exports:
 *   - AuthContext: The context object for authentication state.
 *   - AuthProvider: The provider component that wraps the app and supplies auth state/methods.
 *
 * Usage:
 *   Wrap your app with <AuthProvider> in main.jsx or App.jsx.
 *   Use useContext(AuthContext) or the useAuth() hook to access auth state and actions.
 */

import { createContext, useState, useContext, useEffect, useRef } from 'react';

export const AuthContext = createContext();

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const info = token ? { token, role } : null;
    return info;
  });

  const [lastLogin, setLastLogin] = useState(() => {
    const storedLastLogin = localStorage.getItem('lastLoginAt');
    return storedLastLogin || null;
  });
  const [lastLoginMessage, setLastLoginMessage] = useState(null);

  const logoutTimer = useRef();

  const clearLogoutTimer = () => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
  };

  const scheduleAutoLogout = (token) => {
    clearLogoutTimer();
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) return;
    const expiresAt = payload.exp * 1000; // exp is in seconds
    const now = Date.now();
    const delay = Math.max(0, expiresAt - now - 1000); // logout 1s before expiry
    if (delay <= 0) {
      // already expired
      doLogout();
      return;
    }
    logoutTimer.current = setTimeout(() => {
      doLogout();
    }, delay);
  };

  const doLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('lastLoginAt'); // Clear last login on logout
    setUser(null);
    setLastLogin(null);
    // force navigate to landing/login
    try {
      window.location.href = '/';
    } catch (e) {
      // ignore
    }
  };

  const login = (token, role, lastLoginAt = null) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    // Store last login timestamp if provided
    if (lastLoginAt && lastLoginAt !== 'null' && lastLoginAt !== '') {
      localStorage.setItem('lastLoginAt', lastLoginAt);
      setLastLogin(lastLoginAt);
      // Format message
      const date = new Date(lastLoginAt);
      const formatted = date.toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      }).replace(/,([^,]*)$/, ' at$1');
      setLastLoginMessage(`For your security, your last login was on ${formatted}.`);
    } else {
      // Clear last login if not provided (shouldn't happen, but safe)
      localStorage.removeItem('lastLoginAt');
      setLastLogin(null);
      setLastLoginMessage('Welcome! This appears to be your first login.');
    }
    setUser({ token, role });
    scheduleAutoLogout(token);
  };

  const logout = () => {
    clearLogoutTimer();
    doLogout();
  };

  useEffect(() => {
    // on mount, if token present schedule auto logout
    const token = localStorage.getItem('token');
    if (token) scheduleAutoLogout(token);
    return () => clearLogoutTimer();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, lastLogin, lastLoginMessage, setLastLoginMessage }}>
      {children}
    </AuthContext.Provider>
  );
};


