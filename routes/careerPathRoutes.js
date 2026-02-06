const express = require("express");
const {
  generateCareerPath,
  getUserCareerPaths,
  getCareerPathById,
  getDeleteRoadmapById,
  enhanceResume,
} = require("../controllers/careerPathController");
// const { check } = require("express-validator");

const router = express.Router();
router.get("/All/:userId", getUserCareerPaths);

// Get specific career path
router.get("/detail/:id", getCareerPathById);

// delet the roadmap form path_id
router.get("/delete/:id", getDeleteRoadmapById);

router.post("/enhanceResume",enhanceResume)

module.exports = router;
