import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar user={user} onLogout={onLogout} />
      <main className="h-screen-navbar overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout; 