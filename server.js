/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
var mongoose = require('mongoose');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

var requireAuth = authJwtController.isAuthenticated; // Just for adding the jwt auth to Movies

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});


// Get and post but for all movies
router.route('/movies')

    .post(requireAuth, function(req, res) {
        var movie = new Movie(req.body);
        movie.save(function(err, savedMovie) {
            if (err) {
                res.status(400).json({ success: false, message: 'Failed to create movie', error: err });
            } else {
                res.status(201).json({ success: true, message: 'Movie created successfully', movie: savedMovie });
            }
        });
    })

    .get(requireAuth, function(req, res) {
        Movie.find({}, function(err, movies) {
            if (err) {
                res.status(500).json({ success: false, message: 'Failed to retrieve movies', error: err });
            } else {
                res.status(200).json({ success: true, movies: movies });
            }
        });
    });




// Routes but by movie ID
router.route('/movies/:id')
    .post(requireAuth, function(req, res) {
        const movieId = req.params.id; // Get the movie ID from the URL parameter

        // First, check if the movie exists to link the review to it
        Movie.findById(movieId, function(err, movie) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error checking the movie', error: err });
            }

            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }

            // If the movie exists, create a new review
            const newReview = new Review({
                movieId: movieId,
                username: req.user.username, // Assuming the username is included in the JWT token
                review: req.body.review,
                rating: req.body.rating
            });

            // Validate and save the new review
            newReview.save(function(err, review) {
                if (err) {
                    return res.status(400).json({ success: false, message: 'Failed to add review', error: err });
                }
                res.status(201).json({ success: true, message: 'Review added successfully', review: review });
            });
        });
    })
    .get(requireAuth, function(req, res) {
        const movieId = mongoose.Types.ObjectId(req.params.id); // Convert the string ID to a MongoDB ObjectId

        const aggregate = [
            {
                $match: { _id: movieId }
            },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'movieId',
                    as: 'movieReviews'
                }
            },
            {
                $addFields: {
                    avgRating: { $avg: '$movieReviews.rating' }
                }
            }
        ];

        Movie.aggregate(aggregate).exec((err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to retrieve movie', error: err });
            }
            if (result.length === 0) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }
            res.json({ success: true, movie: result[0] }); // Assuming the aggregation returns exactly one document
        });
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


