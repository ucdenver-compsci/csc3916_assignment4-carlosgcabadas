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
    .get(requireAuth, function(req, res) {
        var movieId = req.params.id;
        var includeReviews = req.query.reviews === 'true';

        if (includeReviews) {
            Movie.aggregate([
                { $match: { _id: mongoose.Types.ObjectId(movieId) } },
                { $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "movieId",
                    as: "movieReviews"
                }},
                { $addFields: {
                    avgRating: { $avg: '$movieReviews.rating' }
                }},
                { $sort: { avgRating: -1 } }
            ]).exec(function (err, result) {
                if (err) {
                    res.status(500).json({ success: false, message: 'Internal server error', error: err });
                } else if (!result || result.length === 0) {
                    res.status(404).json({ success: false, message: 'Movie not found' });
                } else {
                    res.json({ success: true, movie: result[0] });
                }
            });
        } else {
            Movie.findById(movieId).exec((err, movie) => {
                if (err) {
                    res.status(500).json({ success: false, message: 'Internal server error', error: err });
                } else if (!movie) {
                    res.status(404).json({ success: false, message: 'Movie not found' });
                } else {
                    res.json({ success: true, movie: movie });
                }
            });
        }
    })
    .put(requireAuth, function(req, res) {
        var movieId = req.params.id;
        Movie.findByIdAndUpdate(movieId, req.body, { new: true }, function(err, updatedMovie) {
            if (err) {
                res.status(400).json({ success: false, message: 'Failed to update movie', error: err });
            } else if (!updatedMovie) {
                res.status(404).json({ success: false, message: 'Movie not found' });
            } else {
                res.status(200).json({ success: true, message: 'Movie updated successfully', movie: updatedMovie });
            }
        });
    })
    .delete(requireAuth, function(req, res) {
        var movieId = req.params.id;
        Movie.findByIdAndDelete(movieId, function(err, deletedMovie) {
            if (err) {
                res.status(400).json({ success: false, message: 'Failed to delete movie', error: err });
            } else if (!deletedMovie) {
                res.status(404).json({ success: false, message: 'Movie not found' });
            } else {
                res.status(200).json({ success: true, message: 'Movie deleted successfully', movie: deletedMovie });
            }
        });
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


