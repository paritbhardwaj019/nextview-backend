const { nodeEnv, jwtSecret, frontendUrl } = require("../config");
const { Dealer, OTP } = require("../models");
const httpStatus = require("http-status");
const bcrypt = require("bcryptjs");
const sendOTP = require("../utils/sendOTP");
const jwt = require("jsonwebtoken");
const generateOTPEmail = require("../mail/generateOTPEmail");
const generateVerificationEmail = require("../mail/generateVerificationEmail");
const otpGenerator = require("otp-generator");
const sendMail = require("../utils/sendMail");
const uploadImageToCloudinary = require("../utils/uploadImageToCloudinary");
const getGSTINDetails = require("../utils/getGSTINDetails");

module.exports = {
  signUpDealer: async (req, res) => {
    const { authType } = req.query;
    const { phoneNumber, email } = req.body;

    delete req.body.isPhoneVerified;
    delete req.body.isEmailVerified;
    delete req.body.role;

    try {
      if (!authType) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "Authentication type not provided. Please include 'authType' in your request.",
        });
      }

      let query = {};
      if (authType === "email") {
        query = { $or: [{ email }, { phoneNumber }] };
      } else if (authType === "phone" || authType === "password") {
        query = { phoneNumber };
      }

      const isDealerAlreadyExists = await Dealer.findOne(query);

      if (isDealerAlreadyExists) {
        let errMessage = `User with phone already exists.`;

        if (authType === "email") {
          errMessage = "Please use a different email or phone number.";
        }

        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: errMessage,
        });
      }

      let hashedPassword = "";
      if (authType === "password") {
        hashedPassword = await bcrypt.hash(req.body.password, 10);
      }

      let panPhoto = "";
      if (req?.file && req?.file?.fieldname === "panPhoto") {
        const { secure_url } = await uploadImageToCloudinary(req.file.path);
        panPhoto = secure_url;
      }

      let companyName = "";
      if (req.body.accountType === "warrior") {
        const data = await getGSTINDetails(req.body.gstInNumber);
        companyName = data?.data?.lgnm;
      } else {
        companyName = req.body.companyName;
      }

      const newDealer = await Dealer.create({
        ...req.body,
        authType,
        password: hashedPassword,
        panPhoto,
        companyName,
        role: "dealer",
      });

      if (authType === "email") {
        const verificationToken = jwt.sign(
          { email: req.body.email },
          jwtSecret,
          { expiresIn: "1h" }
        );

        const link = `${frontendUrl}/verify?token=${verificationToken}`;

        const { body, text } = await generateVerificationEmail({
          name: req.body.ownerName,
          link: link,
        });
        await sendMail({
          toEmail: req.body.email,
          toName: req.body.ownerName,
          subject: "Verify Your Email Address",
          htmlPart: body,
          textPart: text,
        });
      }

      res.status(httpStatus.CREATED).json({
        status: "success",
        msg: "Dealer created successfully",
        data: newDealer,
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },

  signInDealer: async (req, res) => {
    try {
      const { phoneNumber, password, otp } = req.body;

      const user = await Dealer.findOne({ phoneNumber });

      if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "User not found. Please check your credentials.",
        });
      }

      if (!user?.authType === "email" && !user.isEmailVerified) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "User's email not verified",
        });
      }

      if (user?.authType === "email" && !user?.email) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "User's email not found",
        });
      }

      if (user.authType === "password") {
        if (!password) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: "fail",
            msg: "Password is required for password authentication.",
          });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: "fail",
            msg: "Invalid password. Please check your credentials.",
          });
        }
      } else if (user.authType === "phone" || user.authType === "email") {
        if (!otp) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: "fail",
            msg: "OTP is required for phone or email authentication.",
          });
        }

        const otpHolder = await OTP.find({
          $or: [{ number: phoneNumber }, { email: user.email }],
        });

        const rightOtpFind = otpHolder[otpHolder.length - 1];
        const validUser = await bcrypt.compare(req.body.otp, rightOtpFind.otp);

        if (!(otpHolder && validUser)) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: "fail",
            msg: "Invalid OTP. Please check your credentials.",
          });
        }
      }

      delete user.isPhoneVerified;
      delete user.password;
      delete user.isEmailVerified;

      const token = jwt.sign({ user }, jwtSecret, {
        expiresIn: "1h",
      });

      await OTP.deleteMany({
        $or: [{ number: phoneNumber }, { email: user.email }],
      });

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "User authenticated successfully",
        token,
        data: { user, token },
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
  sendOTPForSignin: async (req, res) => {
    const { phoneNumber } = req.body;
    try {
      const user = await Dealer.findOne({ phoneNumber });

      if (!user) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "User not found. Please check your phone.",
        });
      }

      if (user?.authType === "email" && !user?.isEmailVerified) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "Email is not verified",
        });
      }

      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      const hashedOTP = await bcrypt.hash(otp, 10);

      if (user.authType === "email") {
        await OTP.create({
          email: user.email,
          otp: hashedOTP,
        });
        const { body, text } = await generateOTPEmail({
          otp,
          name: user?.ownerName,
        });

        await sendMail({
          toEmail: user.email,
          toName: user.ownerName,
          subject: "OTP for SignIn",
          htmlPart: body,
          textPart: text,
        });

        return res.status(httpStatus.OK).json({
          status: "success",
          msg: "OTP sent succesfully to user email",
        });
      }

      if (user.authType === "phone") {
        await sendOTP({
          phoneNumber,
        });

        return res.status(httpStatus.OK).json({
          status: "success",
          msg: "OTP sent succesfully to user phone",
        });
      }
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
  getAuthType: async (req, res) => {
    const { phoneNumber } = req.query;
    try {
      const dealer = await Dealer.findOne({ phoneNumber });
      if (!dealer) {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "fail",
          msg: "Dealer not found",
        });
      }

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Dealer auth type",
        data: dealer?.authType,
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
  fetchAllDealers: async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;

    try {
      let query = {};

      if (search) {
        query = {
          $or: [
            { phoneNumber: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { ownerName: { $regex: search, $options: "i" } },
          ],
        };
      }

      const totalDealersCount = await Dealer.countDocuments(query);
      const totalPages = Math.ceil(totalDealersCount / limit);

      const allDealers = await Dealer.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Fetched All Dealers",
        data: {
          totalResults: totalDealersCount,
          totalPages: totalPages,
          currentPage: parseInt(page),
          dealers: allDealers,
        },
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
  verifyEmail: async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: "fail",
        msg: "Token not provided in the request body.",
      });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      const newDealer = await Dealer.findOneAndUpdate(
        { email: decoded?.email },
        {
          isEmailVerified: true,
        },
        {
          new: true,
        }
      ).select("_id ownerName email isEmailVerified");

      return res.status(200).json({
        status: "success",
        msg: "Email verified successfully.",
        data: newDealer,
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          status: "fail",
          msg: "Token has expired.",
        });
      }

      return res.status(401).json({
        status: "fail",
        msg: "Invalid token.",
      });
    }
  },
};
