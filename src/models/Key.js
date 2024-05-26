const mongoose = require("mongoose");

const keySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["z+", "a+"],
      required: true,
    },
    subBoxNo: {
      type: String,
      required: true,
    },
    license: {
      type: String,
      unique: true,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["activated", "deactivated"],
      default: "deactivated",
    },
    activation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activation",
    },
  },
  {
    timestamps: true,
  }
);

const Key = mongoose.model("Key", keySchema);

module.exports = Key;
