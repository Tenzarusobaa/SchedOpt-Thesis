// src/api/table.js
const express = require("express");
const router = express.Router();

// Get timetable data with days where ds_day_type is 'Single'
router.get("/timetable", (req, res) => {
  const db = req.db; // reuse connection from main.js

  const query = `
    SELECT ds_day 
    FROM tbl_day_slot 
    WHERE ds_day_type = 'Single'
    ORDER BY FIELD(ds_day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query failed:", err);
      return res.status(500).json({ error: "Failed to fetch timetable data" });
    }

    const days = results.map(row => row.ds_day);
    res.json(days);
  });
});

// Get time slots from tbl_time_slot ordered by ts_key
router.get("/timeslots", (req, res) => {
  const db = req.db;

  const query = `
    SELECT ts_final 
    FROM tbl_time_slot 
    ORDER BY ts_key ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query failed:", err);
      return res.status(500).json({ error: "Failed to fetch time slots" });
    }

    const timeSlots = results.map(row => row.ts_final);
    res.json(timeSlots);
  });
});

// Get final assignment data
router.get("/final-assignments", (req, res) => {
  const db = req.db;

  const query = `
    SELECT 
      fa_course_section,
      fa_room_code,
      fa_final_timeslot,
      fa_day_abbr,
      fa_start_time,
      fa_end_time,
      fa_department
    FROM tbl_final_assignment
    ORDER BY fa_start_time, fa_end_time
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query failed:", err);
      return res.status(500).json({ error: "Failed to fetch final assignments" });
    }

    res.json(results);
  });
});

// Update a final assignment
router.post("/update", (req, res) => {
  const db = req.db;
  const { course_code_section, newDay, newTimeslot } = req.body;

  if (!course_code_section || !newDay || !newTimeslot) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Step 1: Get current assignment
  const getAssignmentQuery = `
    SELECT fa_room_code, fa_day_abbr, fa_start_time, fa_end_time 
    FROM tbl_final_assignment 
    WHERE fa_course_section = ?
  `;

  db.query(getAssignmentQuery, [course_code_section], (err, assignmentResult) => {
    if (err) {
      console.error("Error getting assignment:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (assignmentResult.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const assignment = assignmentResult[0];
    const room = assignment.fa_room_code;

    // Day relationships for conflict checking
    const dayRelationships = {
      'M': ['M', 'MTh'],
      'T': ['T', 'TF'],
      'W': ['W', 'WS'],
      'Th': ['Th', 'MTh'],
      'F': ['F', 'TF'],
      'S': ['S', 'WS'],
      'Su': ['Su'],
      'MTh': ['M', 'Th', 'MTh'],
      'TF': ['T', 'F', 'TF'],
      'WS': ['W', 'S', 'WS']
    };

    const conflictingDays = dayRelationships[newDay] || [newDay];
    const placeholders = conflictingDays.map(() => '?').join(',');

    // Step 2: Check conflicts
    const conflictQuery = `
      SELECT fa_course_section, fa_room_code, fa_day_abbr, fa_final_timeslot
      FROM tbl_final_assignment
      WHERE fa_room_code = ?
        AND fa_day_abbr IN (${placeholders})
        AND fa_final_timeslot = ?
        AND fa_course_section != ?
    `;

    db.query(
      conflictQuery,
      [room, ...conflictingDays, newTimeslot, course_code_section],
      (err, conflictResult) => {
        if (err) {
          console.error("Error checking for conflicts:", err);
          return res.status(500).json({ error: "Database conflict check failed" });
        }

        if (conflictResult.length > 0) {
          const conflictItem = conflictResult[0];
          return res.status(400).json({
            error: "Schedule conflict detected",
            conflict: {
              course_code_section: conflictItem.fa_course_section,
              room: conflictItem.fa_room_code,
              day: conflictItem.fa_day_abbr,
              timeslot: conflictItem.fa_final_timeslot
            }
          });
        }

        // Step 3: Update if no conflict
        const [startTime, endTime] = newTimeslot.split(' - ');

        const updateQuery = `
          UPDATE tbl_final_assignment 
          SET fa_day_abbr = ?, fa_final_timeslot = ?, fa_start_time = ?, fa_end_time = ?
          WHERE fa_course_section = ?
        `;

        db.query(
          updateQuery,
          [newDay, newTimeslot, startTime, endTime, course_code_section],
          (err) => {
            if (err) {
              console.error("Error updating database:", err);
              return res.status(500).json({ error: "Database update failed" });
            }

            res.json({ success: true, message: "Schedule updated successfully" });
          }
        );
      }
    );
  });
});

module.exports = router;
