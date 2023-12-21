const express = require("express");
const router = require("./routes");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Global Middlwares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
router.forEach(({ router, path }) => app.use("/api/v1" + path, router));

app.get("/", (req, res) => res.send("Hello"));

module.exports = app;
