const mongoose = require("mongoose");
const config = require("../../config");
const logger = require("../../utils/logger");
const Activation = require("../../models/Activation");

(async () => {
  try {
    await mongoose.connect(config.dbUrl);

    logger.info("Database connected successfully");

    const docs = await Activation.find({
      licenseNo: "KAV001331744",
    });

    for (const doc of docs) {
      const purchasedOn = doc.purchasedOn;

      if (purchasedOn) {
        try {
          const parsedDate = new Date(purchasedOn).toISOString();

          await Activation.updateOne(
            { _id: doc._id },
            { $set: { purchasedOn: parsedDate } }
          );
        } catch (error) {
          logger.error(
            `Failed to convert date for document with _id: ${doc._id}`,
            error
          );
        }
      }
    }

    logger.info("Activation migration completed successfully");
  } catch (error) {
    logger.error("Database connection failed", error);
  } finally {
    mongoose.disconnect();
  }
})();
