const winston = require("winston");
const chalk = require("chalk");

const logger = winston.createLogger();

const customFormat = winston.format.printf(({ level, message }) => {
  let newLevel =
    level === "info"
      ? chalk.green(level)
      : level === "error"
      ? chalk.red(level)
      : level;
  return `${newLevel}: ${message}`;
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.simple(), customFormat),
  })
);

module.exports = logger;
