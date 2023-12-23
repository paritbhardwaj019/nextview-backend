const express = require("express");
const router = require("./routes");
const bodyParser = require("body-parser");
const cors = require("cors");
const getGSTINDetails = require("./utils/getGSTINDetails");

const app = express();

// Global Middlwares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
router.forEach(({ router, path }) => app.use("/api/v1" + path, router));

app.get("/", async (req, res) => {
  getGSTINDetails("24ABICS8989E1ZQ");
  res.send("OK");
});

module.exports = app;
