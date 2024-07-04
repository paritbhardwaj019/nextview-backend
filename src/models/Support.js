const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
    },
    description: String,
    category: {
      enum: ["general", "activation"],
      type: String,
      required: true,
    },
    licenseNo: {
      type: String,
    },
    licenseKey: {
      type: String,
    },
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
    },
    status: {
      type: String,
      enum: ["resolved", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Support = mongoose.model("Support", supportSchema);
module.exports = Support;
