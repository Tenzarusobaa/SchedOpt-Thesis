// src/api/main.js
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

//Routes
const tableRoutes = require("./table.js");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "schedopt_db",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("OK Database.");
});

// Use routes
app.use("/api", tableRoutes); // Add this line

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});