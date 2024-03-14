const express = require("express");
const router = express.Router();
const dealerController = require("../controllers/Dealer");
const otpController = require("../controllers/OTP");
const upload = require("../utils/upload");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");

router
  .route("/")
  .get(authenticationMiddleware("admin"), dealerController.fetchAllDealers);
router
  .post("/signup", upload.single("panPhoto"), dealerController.signUpDealer)
  .post("/signin", dealerController.signInDealer);

router
  .route("/:id")
  .put(
    upload.single("profilePic"),
    authenticationMiddleware(["dealer", "admin"]),
    dealerController.editDealerById
  )
  .delete(authenticationMiddleware("admin"), dealerController.deleteDealerById);

router.post("/verify-email", dealerController.verifyEmail);

router.post("/signup/verify-phone", otpController.verifyPhoneNumber);
router.post("/signup/send-phone-otp", dealerController.sendOTPAfterSignup);

router.post("/signin/send-otp", dealerController.sendOTPForSignin);
router.get("/auth-type", dealerController.getAuthType);

module.exports = router;
