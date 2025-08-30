// src/components/TimetableTable.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/TimetableTable.css';

const TimetableTable = ({ searchTerm }) => {
  const [days, setDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsedTimeSlots, setCollapsedTimeSlots] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [originSlot, setOriginSlot] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Department color mapping
  const departmentColors = {
    'CON': '#630000', // Red
    'SED': '#090088', // Blue
    'SLA': '#306844', // Green
    'SMA': '#feb204', // Yellow
    'CSITE': '#ff4d01' // Orange
  };

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

  // Reverse mapping: full day names to abbreviations (including paired days)
  const dayFullToAbbr = {
    'Monday': 'M',
    'Tuesday': 'T',
    'Wednesday': 'W',
    'Thursday': 'Th',
    'Friday': 'F',
    'Saturday': 'S',
    'Sunday': 'Su',
    'Monday,Thursday': 'MTh',
    'Tuesday,Friday': 'TF',
    'Wednesday,Saturday': 'WS'
  };

  // Add a mapping from single days to possible paired days
  const singleToPairedDays = {
    'Monday': ['MTh'],
    'Tuesday': ['TF'],
    'Wednesday': ['WS'],
    'Thursday': ['MTh'],
    'Friday': ['TF'],
    'Saturday': ['WS']
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
      
      // Check if the assignment matches the search term (if any)
      const matchesSearch = !searchTerm || 
        assignment.fa_course_section.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.fa_room_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesDay && matchesTime && matchesSearch;
    });
  };

  const handleDragStart = (e, assignment, day, timeSlot) => {
    const data = JSON.stringify({ 
      item: assignment, 
      daySlot: `${day}${timeSlots.indexOf(timeSlot) + 1}`,
      day: day,
      timeSlot: timeSlot
    });
    e.dataTransfer.setData('text/plain', data);
    setDraggedItem(assignment);
    setOriginSlot({ day, timeSlot });
  };

  // Update the handleDragOver function for better visual feedback
  const handleDragOver = (e, day, timeSlot) => {
    e.preventDefault();
    setHoveredCell({ day, timeSlot });
    
    // Visual feedback for potential drop target
    const cell = e.target.closest('td');
    if (cell && draggedItem) {
      // Check for conflicts
      const cellAssignments = getAssignmentsForCell(day, timeSlot);
      const hasConflict = cellAssignments.some(item => item.fa_room_code === draggedItem.fa_room_code);
      
      cell.style.backgroundColor = hasConflict ? '#ffcccc' : '#ccffcc';
    }
  };

  const handleDragLeave = (e) => {
    // Reset background color and border
    const cell = e.target.closest('td');
    if (cell) {
      cell.style.backgroundColor = '';
      cell.style.border = '';
    }
    setHoveredCell(null);
  };

  const handleDrop = async (e, targetDay, targetTimeSlot) => {
    e.preventDefault();
    
    // Reset background color
    const cell = e.target.closest('td');
    if (cell) {
      cell.style.backgroundColor = '';
    }
    
    let item, sourceDay, sourceTimeSlot;
    
    if (!draggedItem) {
      try {
        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;
        
        const parsedData = JSON.parse(data);
        item = parsedData.item;
        sourceDay = parsedData.day;
        sourceTimeSlot = parsedData.timeSlot;
        
        setDraggedItem(item);
        setOriginSlot({ day: sourceDay, timeSlot: sourceTimeSlot });
      } catch (err) {
        console.error('Error parsing drag data:', err);
        return;
      }
    } else {
      item = draggedItem;
      sourceDay = originSlot.day;
      sourceTimeSlot = originSlot.timeSlot;
    }
    
    await performAssignmentUpdate(item, sourceDay, sourceTimeSlot, targetDay, targetTimeSlot);
    
    setDraggedItem(null);
    setOriginSlot(null);
    setHoveredCell(null);
  };

  const performAssignmentUpdate = async (assignment, sourceDay, sourceTimeSlot, targetDay, targetTimeSlot) => {
    // Check if the assignment is being moved to the same slot
    if (sourceDay === targetDay && sourceTimeSlot === targetTimeSlot) {
      return;
    }
    
    // Determine the target day abbreviation
    let targetDayAbbr;
    
    // If the original assignment was a paired day, try to keep it as a paired day
    if (assignment.fa_day_abbr.includes('Th') || 
        assignment.fa_day_abbr.includes('F') || 
        assignment.fa_day_abbr.includes('S')) {
      
      // Check if the target day can be part of a paired day
      const possiblePairedDays = singleToPairedDays[targetDay];
      if (possiblePairedDays && possiblePairedDays.length > 0) {
        // Use the first possible paired day format
        targetDayAbbr = possiblePairedDays[0];
      } else {
        // Fall back to single day abbreviation
        targetDayAbbr = dayFullToAbbr[targetDay];
      }
    } else {
      // For single days, use the single day abbreviation
      targetDayAbbr = dayFullToAbbr[targetDay];
    }
    
    try {
      const response = await axios.post('http://localhost:5000/api/update', {
        course_code_section: assignment.fa_course_section,
        newDay: targetDayAbbr,
        newTimeslot: targetTimeSlot,
      });

      if (response.data.error) {
        const conflictItem = response.data.conflict;
        const conflictMessage = (
          <span>
            Moving <strong>{assignment.fa_course_section}</strong> from <strong>{sourceDay} {sourceTimeSlot}</strong> to <strong>{targetDay} {targetTimeSlot}</strong> causes schedule conflict in room <strong>{conflictItem.room}</strong> with: <br /><br />
            <strong>{conflictItem.course_code_section}</strong> <strong>{conflictItem.day}</strong> <strong>{conflictItem.timeslot}</strong>
          </span>
        );
        setErrorMessage(conflictMessage);
        return;
      }

      // Show success message
      const successMsg = (
        <span>
          Successfully moved <strong>{assignment.fa_course_section}</strong> from <strong>{sourceDay} {sourceTimeSlot}</strong> to <strong>{targetDay} {targetTimeSlot}</strong>
        </span>
      );
      setSuccessMessage(successMsg);
      
      // Clear any previous error messages
      setErrorMessage('');

      // Refresh the data after successful update
      try {
        const assignmentsResponse = await axios.get('http://localhost:5000/api/final-assignments');
        setAssignments(assignmentsResponse.data);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        console.error('Error refreshing data:', err);
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      if (error.response?.data?.conflict) {
        const conflictItem = error.response.data.conflict;
        const conflictMessage = (
          <span>
            Moving <strong>{assignment.fa_course_section}</strong> from <strong>{sourceDay} {sourceTimeSlot}</strong> to <strong>{targetDay} {targetTimeSlot}</strong> causes schedule conflict in room <strong>{conflictItem.room}</strong> with: <br /><br />
            <strong>{conflictItem.course_code_section}</strong> <strong>{conflictItem.day}</strong> <strong>{conflictItem.timeslot}</strong>
          </span>
        );
        setErrorMessage(conflictMessage);
      } else {
        setErrorMessage('An error occurred while updating the schedule.');
      }
    }
  };

  if (loading) return <div className="loading">Loading timetable...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="timetable-container">
      {errorMessage && (
        <div className="error-popup">
          <p>{errorMessage}</p>
          <button onClick={() => setErrorMessage('')}>Close</button>
        </div>
      )}
      
      {successMessage && (
        <div className="success-popup">
          <p>{successMessage}</p>
          <button onClick={() => setSuccessMessage('')}>Close</button>
        </div>
      )}
      
      {searchTerm && assignments.length > 0 && (
        <div className="search-info">
          Showing results for: <strong>"{searchTerm}"</strong>
        </div>
      )}
      
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
                  {isCollapsed ? (
                    <td 
                      className="expand-message" 
                      colSpan={days.length}
                      onClick={() => toggleTimeSlot(timeSlot)}
                    >
                      Click to Expand
                    </td>
                  ) : (
                    days.map((day, dayIndex) => {
                      const cellAssignments = getAssignmentsForCell(day, timeSlot);
                      const isHovered = hoveredCell && hoveredCell.day === day && hoveredCell.timeSlot === timeSlot;
                      
                      return (
                        <td 
                          key={dayIndex} 
                          className={`timetable-cell ${isHovered ? 'hovered' : ''}`}
                          onDragOver={(e) => handleDragOver(e, day, timeSlot)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, day, timeSlot)}
                        >
                          {cellAssignments.map((assignment, assignmentIndex) => {
                            const departmentColor = departmentColors[assignment.fa_department] || '#5C677D';
                            
                            return (
                              <div 
                                key={assignmentIndex} 
                                className="assignment-info"
                                draggable
                                onDragStart={(e) => handleDragStart(e, assignment, day, timeSlot)}
                                style={{ borderLeft: `4px solid ${departmentColor}` }}
                              >
                                <div className="course-code">{assignment.fa_course_section}: {assignments.fa_program_section}</div>
                                <div className="dash-line">——————————</div>
                                <div className="room-time">
                                  {assignment.fa_room_code} : {assignment.fa_day_abbr} : {assignment.fa_final_timeslot}
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })
                  )}
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