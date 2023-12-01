const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");

const activationSchema = new mongoose.Schema(
  {
    licenseNo: {
      type: String,
      required: true,
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
    dealerCode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
    },
    purchasedOn: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ACTIVATED", "DEACTIVATED"],
    },
  },
  {
    timestamps: true,
  }
);

activationSchema.plugin(mongoosePaginate);

const Activation = mongoose.model("Activation", activationSchema);
module.exports = Activation;
