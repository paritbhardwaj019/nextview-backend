const express = require("express");
const router = express.Router();
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const dashboardController = require("../controllers/Dashboard");

router
  .route("/stats")
  .get(
    authenticationMiddleware(["admin", "dealer"]),
    dashboardController.getAllDashboardData
  );

module.exports = router;
