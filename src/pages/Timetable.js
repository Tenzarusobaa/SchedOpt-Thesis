// src/pages/Timetable.js
import React, { useState } from 'react';
import TimetableTable from '../components/TimetableTable';

const Timetable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  

  return (
    <div className="page-container">
      <div className="timetable-header">
        <h1>Timetable</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search courses or rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <hr></hr>
      <TimetableTable searchTerm={searchTerm} />
    </div>
  );
};

export default Timetable;