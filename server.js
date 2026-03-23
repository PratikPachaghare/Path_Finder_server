const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// ✅ Correct Route Imports
const authRoutes = require("./routes/authRoutes.js");
const assessmentRoutes = require("./routes/assessmentRoutes.js");
const careerPathRoutes = require("./routes/careerPathRoutes.js");
const generateRoadmapRoutes = require("./routes/gerateRoadmap.js"); // Fixed typo
const chatBotRoutes = require("./routes/chatBotRoutes.js"); // Fixed typo
const referralRoutes = require("./routes/referralRoutes.js");

// ✅ Correct Route Usage
app.use("/api/auth", authRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/career-paths", careerPathRoutes); // Fixed naming for consistency
app.use("/api/generate", generateRoadmapRoutes); // Fixed typo
app.use("/api",chatBotRoutes);
app.use("/api/referral", referralRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Career Guidance API" });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || "Server Error",
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
