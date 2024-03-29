const express = require("express");
const router = express.Router();
const activationController = require("../controllers/Activation");
const upload = require("../utils/upload");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");

router
  .route("/")
  .get(
    authenticationMiddleware(["admin", "dealer"]),
    activationController.fetchAllActivations
  );
router
  .route("/upload")
  .post(
    authenticationMiddleware(["admin"]),
    upload.single("file"),
    activationController.uploadActivations
  );

module.exports = router;
