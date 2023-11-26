const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../", ".env") });

module.exports = {
  port: process.env.PORT || "8080",
  dbUrl: process.env.DB_URL,
  mailJetConfig: {
    apiKey: process.env.MAILJET_API_KEY,
    apiSecret: process.env.MAILJET_API_SECRET,
    fromMail: process.env.MAILJET_FROM_EMAIL,
    fromName: process.env.MAILJET_FROM_NAME,
  },
  nodeEnv: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  fast2SmsApiKey: process.env.FAST2SMS_API_KEY,
};
