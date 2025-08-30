//server/api/main.js
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config(); // load .env

// Routes
const tableRoutes = require("./table.js");

const app = express();
const PORT = process.env.PORT || 5000; // Use Railway's dynamic port

app.use(cors());
app.use(bodyParser.json());

// MySQL connection using Railway ENV vars
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to Railway MySQL.");
});

// Pass db to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use("/api", tableRoutes);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("Hello Admin! 🚀 Your API is working.");
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
