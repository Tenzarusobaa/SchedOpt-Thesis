// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Setup from './pages/Setup';
import Buildings from './pages/Buildings';
import Schema from './pages/Schema';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/buildings" element={<Buildings />} />
          <Route path="/schema" element={<Schema />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;