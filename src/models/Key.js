const mongoose = require("mongoose");

const keySchema = new mongoose.Schema({
  seq: {
    type: Number,
    unique: true,
    required: true,
  },
  type: {
    type: String,
    enum: ["z+", "a+"],
    required: true,
  },
  boxNo: {
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
    unique: true,
    required: true,
  },
  status: {
    type: String,
    enum: ["activated", "deactivated"],
    default: "deactivated",
  },
});

keySchema.pre("remove", function (next) {
  mongoose
    .model("Key")
    .updateMany({ seq: { $gt: this.seq } }, { $inc: { seq: -1 } })
    .exec((err) => {
      if (err) {
        return next(err);
      }
      next();
    });
});

const Key = mongoose.model("Key", keySchema);

module.exports = Key;
