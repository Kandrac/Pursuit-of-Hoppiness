var express = require("express");
var router = express.Router({mergeParams: true});
var Brewery = require("../models/brewery");
var Review = require("../models/review");
var middleware = require("../middleware");

// Reviews Index
router.get("/", function (req, res) {
    Brewery.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, brewery) {
        if (err || !brewery) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {brewery: brewery});
    });
});

// Reviews New
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the brewery, only one review per user is allowed
    Brewery.findById(req.params.id, function (err, brewery) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {brewery: brewery});

    });
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    //lookup brewery using ID
    Brewery.findById(req.params.id).populate("reviews").exec(function (err, brewery) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated brewery to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.brewery = brewery;
            //save review
            review.save();
            brewery.reviews.push(review);
            // calculate the new average review for the brewery
            brewery.rating = calculateAverage(brewery.reviews);
            //save brewery
            brewery.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/breweries/' + brewery._id);
        });
    });
});

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {brewery_id: req.params.id, review: foundReview});
    });
});

// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Brewery.findById(req.params.id).populate("reviews").exec(function (err, brewery) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate brewery average
            brewery.rating = calculateAverage(brewery.reviews);
            //save changes
            brewery.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/breweries/' + brewery._id);
        });
    });
});

// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Brewery.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, brewery) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate brewery average
            brewery.rating = calculateAverage(brewery.reviews);
            //save changes
            brewery.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/breweries/" + req.params.id);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router