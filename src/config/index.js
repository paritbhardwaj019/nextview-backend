const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../", ".env") });

module.exports = {
  port: process.env.PORT || "8080",
  dbUrl: process.env.DB_URL,
  resendConfig: {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.FROM_EMAIL,
    fromName: process.env.FROM_NAME,
  },
  nodeEnv: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  fast2SmsApiKey: process.env.FAST2SMS_API_KEY,
  cloudinaryConfig: {
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  },
  gstInApiKey: process.env.GSTIN_API_KEY,
  gmailId: process.env.GMAIL_ID,
  gmailPassword: process.env.GMAIL_PASSWORD,
};
