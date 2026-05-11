import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('tenantops_theme') !== 'light');

  useEffect(() => {
    localStorage.setItem('tenantops_theme', darkMode ? 'dark' : 'light');
    document.body.style.background = darkMode ? '#0f172a' : '#f1f5f9';
  }, [darkMode]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedTenant = localStorage.getItem('tenant');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setTenant(JSON.parse(savedTenant));
      setPage('dashboard');
    }
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('tenant', JSON.stringify(data.tenant));
    setUser(data.user);
    setTenant(data.tenant);
    setPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.clear();
    localStorage.setItem('tenantops_theme', darkMode ? 'dark' : 'light');
    setUser(null);
    setTenant(null);
    setPage('login');
  };

  if (page === 'dashboard') return <Dashboard user={user} tenant={tenant} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />;
  if (page === 'register') return <Register onLogin={handleLogin} onSwitch={() => setPage('login')} darkMode={darkMode} setDarkMode={setDarkMode} />;
  return <Login onLogin={handleLogin} onSwitch={() => setPage('register')} darkMode={darkMode} setDarkMode={setDarkMode} />;
}
