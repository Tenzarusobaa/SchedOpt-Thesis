// src/components/Layout.js
import React from 'react';
import Sidebar from './Sidebar';
import './css/Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;