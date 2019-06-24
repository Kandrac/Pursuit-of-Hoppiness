var Brewery=require("../models/brewery");
var Review = require("../models/review");

// all the middleware goes here
var middlewareObj={};
middlewareObj.checkBreweryOwnership=function(req, res, next){
        if (req.isAuthenticated()) {
            Brewery.findById(req.params.id, function (err, foundBrewery) {
                if (err) {
                    req.flash("error","Brewery not found");
                    res.redirect("back");
                } else {
                    if(foundBrewery.author.id.equals(req.user._id)|| req.user.isAdmin){
                        next();
                    }else{
                        req.flash("error","Access Denied");
                        res.redirect("back");
                    }   
                }
            });
        } else {
            req.flash("error","You must be logged in the do that");
            res.redirect("back");
        }
    
    
    }

    middlewareObj.checkReviewOwnership = function(req, res, next) {
        if(req.isAuthenticated()){
            Review.findById(req.params.review_id, function(err, foundReview){
                if(err || !foundReview){
                    res.redirect("back");
                }  else {
                    // does user own the comment?
                    if(foundReview.author.id.equals(req.user._id)|| req.user.isAdmin) {
                        next();
                    } else {
                        req.flash("error", "You don't have permission to do that");
                        res.redirect("back");
                    }
                }
            });
        } else {
            req.flash("error", "You need to be logged in to do that");
            res.redirect("back");
        }
    };
    
    middlewareObj.checkReviewExistence = function (req, res, next) {
        if (req.isAuthenticated()) {
            Brewery.findById(req.params.id).populate("reviews").exec(function (err, foundBrewery) {
                if (err || !foundBrewery) {
                    req.flash("error", "Brewery not found.");
                    res.redirect("back");
                } else {
                    // check if req.user._id exists in foundBrewery.reviews
                    var foundUserReview = foundBrewery.reviews.some(function (review) {
                        return review.author.id.equals(req.user._id);
                    });
                    if (foundUserReview) {
                        req.flash("error", "You already wrote a review.");
                        return res.redirect("/breweries/" + foundBrewery._id);
                    }
                    // if the review was not found, go to the next middleware
                    next();
                }
            });
        } else {
            req.flash("error", "You need to login first.");
            res.redirect("back");
        }
    };
    


middlewareObj.isLoggedIn=function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You must to be logged in to do that");
    res.redirect("/login");
}


module.exports=middlewareObj;