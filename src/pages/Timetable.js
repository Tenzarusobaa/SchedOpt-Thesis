// src/pages/Timetable.js
import React from 'react';
import TimetableTable from '../components/TimetableTable';

const Timetable = () => {
  return (
    <div className="page-container">
      <h1>Timetable</h1>
      <hr></hr>
      <TimetableTable />
    </div>
  );
};

export default Timetable;