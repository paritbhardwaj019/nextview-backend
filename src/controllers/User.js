const httpStatus = require("http-status");
const { nodeEnv, jwtSecret } = require("../config");
const { User } = require("../models");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");

module.exports = {
  addAdmin: async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: "fail",
        msg: "Passwords do not match",
      });
    }

    try {
      const isAlreadyExists = await User.findOne({ email });

      if (isAlreadyExists) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          status: "fail",
          msg: "Email already exists",
        });
      }

      const user = await User.create({
        name,
        email,
        password,
      });

      const newUser = _.pick(user, ["_id", "name", "email", "role"]);

      res.status(httpStatus.CREATED).json({ user: newUser });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
  loginAdmin: async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: "fail",
        msg: "Passwords do not match",
      });
    }

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          status: "fail",
          msg: "User not found with the given email",
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user?.password);

      if (!isPasswordCorrect) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          status: "fail",
          msg: "Invalid password",
        });
      }

      const newUser = _.pick(user, ["_id", "role", "email", "name"]);
      const token = jwt.sign({ user: newUser }, jwtSecret, {
        expiresIn: "7d",
      });

      res.status(httpStatus.OK).json({ user: newUser, token });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
};
