const httpStatus = require("http-status");
const { nodeEnv } = require("../config");
const { Dealer, OTP } = require("../models");
const bcrypt = require("bcryptjs");

module.exports = {
  verifyPhoneNumber: async (req, res) => {
    try {
      const otpHolder = await OTP.find({ number: req.body.phoneNumber });

      if (otpHolder.length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "You've used an Expired OTP!",
        });
      }

      const rightOtpFind = otpHolder[otpHolder.length - 1];
      const validUser = await bcrypt.compare(req.body.otp, rightOtpFind.otp);

      if (rightOtpFind.number === req.body.phoneNumber && validUser) {
        await Dealer.findOneAndUpdate(
          { phoneNumber: req.body.phoneNumber },
          {
            isPhoneVerified: true,
          },
          {
            new: true,
          }
        );
        await OTP.deleteMany({ number: rightOtpFind.number });
        return res.status(httpStatus.OK).json({
          status: "success",
          msg: "User verified successfully",
        });
      } else {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "Something went wrong",
        });
      }
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
  verifyPhoneOTP: async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      if (!phoneNumber || !otp) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "Phone number and OTP are required.",
        });
      }

      const otpHolder = await OTP.findOne({ number: phoneNumber });

      const rightOtpFind = otpHolder[otpHolder.length - 1];
      const validUser = await bcrypt.compare(req.body.otp, rightOtpFind.otp);

      if (rightOtpFind.number === req.body.phoneNumber && validUser) {
        return res.status(httpStatus.OK).json({
          status: "success",
          msg: "User verified successfully",
          verified: true,
        });
      } else {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "Invalid OTP or phone number",
          verified: false,
        });
      }
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
};
