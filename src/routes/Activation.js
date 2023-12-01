const express = require("express");
const router = express.Router();
const activationController = require("../controllers/Activation");
const upload = require("../utils/upload");

router.route("/").get(activationController.fetchAllActivations);
router
  .route("/upload")
  .post(upload.single("file"), activationController.uploadActivations);

module.exports = router;
