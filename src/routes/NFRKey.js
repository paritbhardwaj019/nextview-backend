const express = require("express");
const router = express.Router();
const nfrKeysController = require("../controllers/NFRKey");
const upload = require("../utils/upload");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");

router
  .route("/")
  .post(
    authenticationMiddleware("admin"),
    upload.single("file"),
    nfrKeysController.addNFRKeys
  )
  .get(
    authenticationMiddleware("dealer"),
    authenticationMiddleware("admin"),
    nfrKeysController.fetchAllNFRKeys
  );
router
  .route(authenticationMiddleware("admin"), "/assign/:id")
  .patch(nfrKeysController.assignDealerToNFRKey);

module.exports = router;
