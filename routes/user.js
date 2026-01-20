const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const userController = require("../controller/user");

router.post("/signup", wrapAsync(userController.signup));

router.post(
  "/login",
  passport.authenticate("local", {
    failureMessage: true
  }),
  userController.login
);

router.post("/logout", userController.logout);

module.exports = router;
