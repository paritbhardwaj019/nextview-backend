const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const { User } = require("../models");
const { dbUrl } = require("../config");
const logger = require("../utils/logger");

mongoose.connect(dbUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let userDetails;

const getUserDetails = () => {
  return new Promise((resolve) => {
    rl.question("Enter name: ", (name) => {
      rl.question("Enter phone: ", (phone) => {
        rl.question("Enter password: ", (password) => {
          rl.question("Enter role (admin): ", (role) => {
            userDetails = {
              name,
              phone,
              password,
              role: role || "admin",
            };
            resolve();
          });
        });
      });
    });
  });
};

const logInfo = (message) => {
  winston.info(message);
};

mongoose.connection
  .on("error", (error) => {
    logger.error("Error connecting to the database:", error);
  })
  .once("open", () => {
    logger.info("Connected to the database successfully.");

    getUserDetails()
      .then(() => bcrypt.hash(userDetails.password, 10))
      .then((hashedPassword) => {
        const newUser = new User({
          name: userDetails.name,
          phone: userDetails.phone,
          password: hashedPassword,
          role: userDetails.role,
        });

        return newUser.save();
      })
      .then(() => {
        console.log("Admin user created successfully.");
      })
      .catch((error) => {
        console.error("Error creating admin user:", error);
      })
      .finally(() => {
        mongoose.connection.close();
        rl.close();
      });
  });
