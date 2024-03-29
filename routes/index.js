var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Brewery = require("../models/brewery");


//Root Route
router.get("/", function (req, res) {
    res.render("landing");
});
//Register form
router.get("/register", function(req, res){
    res.render("register", {page: 'register'}); 
 });

// handle signup logic
router.post("/register", function (req, res) {
    var newUser = new User({ 
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
      });

    if(req.body.adminCode === 'thejuiceisloose') {
        newUser.isAdmin = true;
      }
    User.register(newUser, req.body.password, function (err, user) {
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success","Welcome to Pursuit of Hoppiness "+ user.username);
            return res.redirect("/breweries");

        });
    });
});
// show login form
router.get("/login", function(req, res){
    res.render("login", {page: 'login'}); 
 });
// handeling logic logic
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/breweries",
        failureRedirect: "/login"
    }), function (req, res) {
    });
// logout route
router.get("/logout", function (req, res) {
    req.logOut();
    req.flash("success","Logged you out!")
    res.redirect("/breweries");
});
// USER PROFILE
router.get("/users/:id", function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
      if(err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("/");
      }
      Brewery.find().where('author.id').equals(foundUser._id).exec(function(err, breweries) {
        if(err) {
          req.flash("error", "Something went wrong.");
          return res.redirect("/");
        }
        res.render("users/show", {user: foundUser, breweries: breweries});
      })
    });
  });
  

module.exports = router;