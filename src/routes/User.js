const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/User");

router.post("/signin", userControllers.loginAdmin);
router.post("/signup", userControllers.addAdmin);

module.exports = router;
