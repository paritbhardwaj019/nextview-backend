const mongoose = require("mongoose");

const nfrKeySchema = new mongoose.Schema(
  {
    licenseNo: {
      type: String,
      required: true,
    },
    licenseKey: {
      type: String,
      required: true,
    },
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
    },
  },
  {
    timestamps: true,
  }
);

const NFRKey = mongoose.model("NFRKey", nfrKeySchema);
module.exports = NFRKey;
