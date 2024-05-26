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
      type: String,
    },
    expiresOn: {
      type: String,
    },
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
    },
    type: {
      type: String,
      enum: ["z+", "a+"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Activation = mongoose.model("Activation", activationSchema);
module.exports = Activation;
