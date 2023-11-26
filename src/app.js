const express = require("express");
const router = require("./routes");
const bodyParser = require("body-parser");
const sendOTP = require("./utils/sendOTP");

const app = express();

// Global Middlwares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
router.forEach(({ router, path }) => app.use("/api/v1" + path, router));

module.exports = app;
