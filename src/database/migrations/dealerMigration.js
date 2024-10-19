const mongoose = require("mongoose");
const config = require("../../config");
const logger = require("../../utils/logger");
const Dealer = require("../../models/Dealer");

(async () => {
  try {
    await mongoose.connect(config.dbUrl);

    logger.info("Database connected successfully");

    await Dealer.updateMany(
      {
        $or: [
          {
            authType: {
              $in: ["phone", "password"],
            },
          },
          {
            isEmailVerified: false,
          },
        ],
      },
      {
        $set: {
          isEmailVerified: true,
          authType: "email",
        },
      }
    );

    logger.info("Dealers migration completed successfully");
  } catch (error) {
    logger.error("Database connection failed", error);
  } finally {
    mongoose.disconnect();
  }
})();
