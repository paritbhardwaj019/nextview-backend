const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    number: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    expires: 300,
  }
);

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
