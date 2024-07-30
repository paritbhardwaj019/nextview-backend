const express = require("express");
const router = express.Router();
const keyController = require("../controllers/Key");
const upload = require("../utils/upload");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");

router
  .route("/")
  .get(authenticationMiddleware(["admin"]), keyController.fetchAllKeys);
router
  .route("/upload")
  .post(
    authenticationMiddleware(["admin"]),
    upload.single("file"),
    keyController.uploadKeys
  );

router
  .route("/:id")
  .delete(authenticationMiddleware(["admin"]), keyController.deleteKeyById);

module.exports = router;
