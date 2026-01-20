  const express = require("express");
    const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirect } = require("../middleware");
const userController = require("../controller/user");

  router.route("/signup")
 .get((req, res)=>{
        res.render("./user/signup.ejs");
    })   
   .post(wrapAsync (userController.signup));

  

      router.route("/login")
      .get((req, res)=>{
        res.render("./user/login.ejs");
    }).post(
      saveRedirect,
      passport.authenticate("local",
         { failureRedirect: "/login", 
            failureFlash : true,}), 
      userController.login);


      //logout route
  router.get("/logout", userController.logout);

    module.exports = router;
