import React, { useState, useEffect } from 'react';
import { AdminLogin } from './blocks/AdminLogin/AdminLogin';
import { AdminPanel } from './blocks/AdminPanel/AdminPanel';
import { SessionProvider } from './contexts/SessionContext';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Проверяем, есть ли сохраненная сессия администратора
  useEffect(() => {
    const adminSession = sessionStorage.getItem('adminAuthenticated');
    if (adminSession === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (username: string, password: string) => {
    if (username === 'admin' && password === '12345') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
  };

  return (
    <SessionProvider>
      {isAuthenticated ? (
        <AdminPanel onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </SessionProvider>
  );
}
