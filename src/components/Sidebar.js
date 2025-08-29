// src/components/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './css/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/timetable', label: 'Timetable', icon: '📅' },
    { path: '/setup', label: 'Setup', icon: '⚙️' },
    { path: '/buildings', label: 'Buildings', icon: '🏢' },
    { path: '/schema', label: 'Schema', icon: '📋' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>SchedOpt</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;