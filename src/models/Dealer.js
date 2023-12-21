const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: "",
    },
    ownerName: {
      type: String,
    },
    panNumber: {
      type: String,
    },
    panPhoto: {
      type: String,
    },
    companyName: {
      type: String,
    },
    accountType: {
      type: String,
      enum: ["partner", "warrior"],
      default: "partner",
    },
    phoneNumber: {
      type: String,
    },
    address: {
      pincode: {
        type: String,
      },
      district: {
        type: String,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
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
      default: true,
    },
    isEmailVerified: {
      type: String,
      default: true,
    },
    role: {
      type: String,
      enum: ["admin", "dealer"],
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
