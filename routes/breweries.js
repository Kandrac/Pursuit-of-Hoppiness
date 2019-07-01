var express = require("express");
var router = express.Router();
var Brewery= require("../models/brewery");
var Review = require("../models/review");
var middleware=require("../middleware")
var NodeGeocoder = require('node-geocoder');

 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);



//INDEX - show all breweries
router.get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all breweries from DB
        Brewery.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allBreweries) {
            Brewery.count({name: regex}).exec(function (err, count) {
            if(err){
               console.log(err);
               res.redirect("back")
           } else {
              if(allBreweries.length < 1) {
                  noMatch = "No Breweries match that query, please try again.";
              }
              res.render("breweries/index", {
                breweries: allBreweries,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                noMatch: noMatch,
                search: req.query.search
            });
        }
    });
});
    } else {
        // Get all breweries from DB
        Brewery.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allBreweries) {
           Brewery.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("breweries/index", {
                        breweries: allBreweries,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});

//CREATE - add new brewery to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to breweries array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    geocoder.geocode(req.body.location, function (err, data) {
      if (err || !data.length) {
        req.flash('error', 'Invalid address');
        return res.redirect('back');
      }
      var lat = data[0].latitude;
      var lng = data[0].longitude;
      var location = data[0].formattedAddress;
      var newBrewery = {name: name, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
      // Create a new brewery and save to DB
      Brewery.create(newBrewery, function(err, newlyCreated){
          if(err){
              console.log(err);
          } else {
              //redirect back to brewery page
              console.log(newlyCreated);
              res.redirect("/breweries");
          }
      });
    });
  });

//new route
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("breweries/new");
});
//Show- shows more info about one brewery
router.get("/:id", function (req, res) {
    //find the brewery with provided ID
    Brewery.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundBrewery) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that brewery
            res.render("breweries/show", {brewery: foundBrewery});
        }
    });
});

//EDIT Brewery ROUTE
router.get("/:id/edit",middleware.checkBreweryOwnership, function (req, res) {
   Brewery.findById(req.params.id, function (err, foundBrewery) {
    res.render("breweries/edit",{brewery:foundBrewery});
        });
    });

   // UPDATE Brewery ROUTE
router.put("/:id", middleware.checkBreweryOwnership, function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost, location: location, lat: lat, lng: lng};
        Brewery.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, brewery){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success","Successfully Updated!");
                res.redirect("/breweries/" + brewery._id);
            }
        });
      });
    });
// Destroy Brewery Router
router.delete("/:id", middleware.checkBreweryOwnership, function (req, res) {
    Brewery.findById(req.params.id, function (err, brewery) {
        if (err) {
            res.redirect("/breweries");
        } else {
                    //  delete the brewery
                    brewery.remove();
                    req.flash("success", "Brewery deleted successfully!");
                    res.redirect("/breweries");
 
        }
    });
});
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;