const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      default: "",
    },
    ownerName: {
      type: String,
      required: true,
    },
    panNumber: {
      type: String,
      required: true,
    },
    panPhoto: {
      type: String,
    },
    companyName: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ["partner", "warrior"],
      required: true,
      default: "partner",
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      pincode: {
        type: String,
        required: true,
      },
      district: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    referredBy: {
      type: String,
      enum: ["self", "dealer"],
      default: "self",
    },
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
    },
    authType: {
      type: String,
      enum: ["password", "email", "phone"],
      default: "password",
    },
    isPhoneVerified: {
      type: String,
      required: true,
      default: true,
    },
    isEmailVerified: {
      type: String,
      required: true,
      default: true,
    },
    password: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Dealer = mongoose.model("Dealer", dealerSchema);
module.exports = Dealer;
