const unirest = require("unirest");
const otpGenerator = require("otp-generator");
const { fast2SmsApiKey } = require("../config");
const { OTP } = require("../models");
const bcrypt = require("bcryptjs");

const sendOtpViaFast2Sms = ({ phoneNumber }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      const hasedOTP = await bcrypt.hash(otp, 10);

      await OTP.create({
        number: phoneNumber,
        otp: hasedOTP,
      });

      const request = unirest.post("https://www.fast2sms.com/dev/bulkV2");

      request.headers({
        Authorization: fast2SmsApiKey,
      });
      request.form({
        variables_values: otp.toString(),
        route: "otp",
        numbers: phoneNumber.toString(),
      });
      request.end((response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.body);
          console.log(response.body);
        }
      });
      resolve("OK");
    } catch (error) {
      reject(error);
      throw new Error(error);
    }
  });
};

module.exports = sendOtpViaFast2Sms;
