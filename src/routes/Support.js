const express = require("express");
const router = express.Router();
const supportController = require("../controllers/Support");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");

router.put(
  "/markasresolved/:id",
  authenticationMiddleware(["admin"]),
  supportController.markAsResolved
);

router
  .route("/")
  .post(
    authenticationMiddleware(["dealer"]),
    supportController.createSupportRequest
  )
  .get(
    authenticationMiddleware(["admin"]),
    supportController.getAllSupportRequests
  );

module.exports = router;
