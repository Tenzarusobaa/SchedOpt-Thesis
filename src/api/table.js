// src/api/table.js
const express = require("express");
const mysql = require("mysql2");
const router = express.Router();

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "schedopt_db",
});

// Get timetable data with days where ds_day_type is 'Single'
router.get("/timetable", (req, res) => {
  const query = `
    SELECT ds_day 
    FROM tbl_day_slot 
    WHERE ds_day_type = 'Single'
    ORDER BY FIELD(ds_day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query failed:", err);
      res.status(500).json({ error: "Failed to fetch timetable data" });
      return;
    }
    
    // Extract just the day names from the results
    const days = results.map(row => row.ds_day);
    res.json(days);
  });
});

// Get time slots from tbl_time_slot ordered by ts_key
router.get("/timeslots", (req, res) => {
  const query = `
    SELECT ts_final 
    FROM tbl_time_slot 
    ORDER BY ts_key ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query failed:", err);
      res.status(500).json({ error: "Failed to fetch time slots" });
      return;
    }
    
    // Extract just the time slot strings from the results
    const timeSlots = results.map(row => row.ts_final);
    res.json(timeSlots);
  });
});

// NEW: Get final assignment data
router.get("/final-assignments", (req, res) => {
  const query = `
    SELECT 
      fa_course_section,
      fa_room_code,
      fa_final_timeslot,
      fa_day_abbr,
      fa_start_time,
      fa_end_time
    FROM tbl_final_assignment
    ORDER BY fa_start_time, fa_end_time
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query failed:", err);
      res.status(500).json({ error: "Failed to fetch final assignments" });
      return;
    }
    
    res.json(results);
  });
});

module.exports = router;