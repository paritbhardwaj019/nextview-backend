const express = require("express");
const router = express.Router();
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const expirationController = require("../controllers/Expiration");

router
  .route("/")
  .get(
    authenticationMiddleware(["dealer", "admin"]),
    expirationController.getAllExpirations
  );

module.exports = router;
