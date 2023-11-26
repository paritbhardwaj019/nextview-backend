const { default: mongoose } = require("mongoose");
const config = require("../config");
const logger = require("../utils/logger");

module.exports = async () => {
  try {
    await mongoose.connect(config.dbUrl);
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};
