const express = require("express");
const router = express.Router();
const dealerController = require("../controllers/Dealer");
const otpController = require("../controllers/OTP");

router.route("/").get(dealerController.fetchAllDealers);
router
  .post("/signup", dealerController.signUpDealer)
  .post("/signin", dealerController.signInDealer);

router.post("/signup/verify", otpController.verifyPhoneNumber);
router.post("/signin/send-otp", dealerController.sendOTPForSignin);
router.get("/auth-type", dealerController.getAuthType);

module.exports = router;
