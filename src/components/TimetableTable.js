// src/components/TimetableTable.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/TimetableTable.css';

const TimetableTable = () => {
  const [days, setDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedTimeSlots, setCollapsedTimeSlots] = useState({});

  // Map day abbreviations to full day names
  const dayAbbrToFull = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'Th': 'Thursday',
    'F': 'Friday',
    'S': 'Saturday',
    'Su': 'Sunday',
    'MTh': 'Monday,Thursday',
    'TF': 'Tuesday,Friday',
    'WS': 'Wednesday,Saturday'
  };

  // Toggle collapse state for a specific time slot
  const toggleTimeSlot = (timeSlot) => {
    setCollapsedTimeSlots(prev => ({
      ...prev,
      [timeSlot]: !prev[timeSlot]
    }));
  };

  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        // Fetch days, time slots, and assignments concurrently
        const [daysResponse, timeSlotsResponse, assignmentsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/timetable'),
          axios.get('http://localhost:5000/api/timeslots'),
          axios.get('http://localhost:5000/api/final-assignments')
        ]);
        
        setDays(daysResponse.data);
        setTimeSlots(timeSlotsResponse.data);
        setAssignments(assignmentsResponse.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch timetable data');
        setLoading(false);
        console.error('Error fetching timetable data:', err);
      }
    };

    fetchTimetableData();
  }, []);

  // Function to check if an assignment matches a specific day and time slot
  const getAssignmentsForCell = (day, timeSlot) => {
    return assignments.filter(assignment => {
      // Convert day abbreviation to full day names
      const assignmentDays = dayAbbrToFull[assignment.fa_day_abbr]?.split(',') || [];
      
      // Check if the assignment occurs on this day
      const matchesDay = assignmentDays.includes(day);
      
      // Check if the assignment's time slot matches
      const matchesTime = assignment.fa_final_timeslot === timeSlot;
      
      return matchesDay && matchesTime;
    });
  };

  if (loading) return <div className="loading">Loading timetable...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="timetable-container">
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Time</th>
            {days.map((day, index) => (
              <th key={index}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((timeSlot, timeIndex) => {
            const isCollapsed = collapsedTimeSlots[timeSlot];
            
            return (
              <React.Fragment key={timeIndex}>
                <tr className={`time-slot-row ${isCollapsed ? 'collapsed' : ''}`}>
                  <td 
                    className="time-cell clickable" 
                    onClick={() => toggleTimeSlot(timeSlot)}
                    title={isCollapsed ? "Click to expand" : "Click to collapse"}
                  >
                    {timeSlot}
                    <span className="collapse-indicator">
                      {isCollapsed ? '▶' : '▼'}
                    </span>
                  </td>
                  {days.map((day, dayIndex) => {
                    if (isCollapsed) {
                      return <td key={dayIndex} className="timetable-cell collapsed-cell"></td>;
                    }
                    
                    const cellAssignments = getAssignmentsForCell(day, timeSlot);
                    
                    return (
                      <td key={dayIndex} className="timetable-cell">
                        {cellAssignments.map((assignment, assignmentIndex) => (
                          <div key={assignmentIndex} className="assignment-info">
                            <div className="course-code">{assignment.fa_course_section}</div>
                            <div className="dash-line">——————————</div>
                            <div className="room-time">
                              {assignment.fa_room_code} — {assignment.fa_final_timeslot}
                            </div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableTable;