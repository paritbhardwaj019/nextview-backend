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
      pinCode: {
        type: String,
      },
      street: {
        type: String,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
      },
      city: {
        type: String,
      },
    },
    referredBy: {
      type: String,
      enum: ["self", "dealer"],
      default: "self",
    },
    authType: {
      type: String,
      enum: ["password", "email", "phone"],
      default: "password",
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["dealer"],
    },
    password: {
      type: String,
    },
    gstInNumber: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Dealer = mongoose.model("Dealer", dealerSchema);
module.exports = Dealer;
