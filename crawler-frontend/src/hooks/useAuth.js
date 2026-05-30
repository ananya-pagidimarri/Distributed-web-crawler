import { useState, useEffect } from 'react';

const API_URL = '/api';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load active session from localStorage
  useEffect(() => {
    const session = localStorage.getItem('crawlx_session');
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch {
        localStorage.removeItem('crawlx_session');
      }
    }
    setLoading(false);
  }, []);

  // Register a new user via Backend API
  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (!data.success) {
        return { success: false, message: data.message };
      }
      return { success: true, message: 'Registration successful! Please login.' };
    } catch (err) {
      return { success: false, message: 'Server error during registration.' };
    }
  };

  // Login via Backend API
  const login = async (email, password, expectedRole = null) => {
    try {
      const endpoint = expectedRole === 'admin' ? '/user/admin/login' : '/user/login';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!data.success) {
        return { success: false, message: data.message || 'Invalid credentials' };
      }

      // Save session
      const session = { 
        name: data.user.name, 
        email: data.user.email, 
        role: data.user.role,
        token: data.token 
      };
      
      localStorage.setItem('crawlx_session', JSON.stringify(session));
      setUser(session);
      return { success: true, role: data.user.role };
    } catch (err) {
      return { success: false, message: 'Server error during login.' };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('crawlx_session');
    setUser(null);
  };

  return { user, loading, register, login, logout };
}
