const mongoose = require("mongoose");

const activationSchema = new mongoose.Schema(
  {
    licenseNo: {
      type: String,
      required: true,
      unique: true,
    },
    licenseKey: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    purchasedOn: {
      type: Date,
    },
    expiresOn: {
      type: String,
    },
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "expired"],
    },
    type: {
      type: String,
      required: true,
    },
    isNFR: {
      type: Boolean,
      default: false,
    },
    city: {
      type: String,
    },
    district: {
      type: String,
    },
    pinCode: {
      type: String,
      default: null,
    },
    dealerPhone: {
      type: String,
      trim: true,
    },
    key: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Key",
    },
  },
  {
    timestamps: true,
  }
);

const Activation = mongoose.model("Activation", activationSchema);
module.exports = Activation;
