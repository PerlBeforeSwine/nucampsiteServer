const express = require('express');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate');

const campsiteRouter = express.Router();

campsiteRouter
  .route('/')
  .get((req, res, next) => {
    console.log("Getting campsites")
    Campsite.find()
      .populate('comments.author')
      .then((campsites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsites);
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.create(req.body)
      .then((campsite) => {
        console.log('Campsite Created ', campsite);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
      })
      .catch((err) => next(err));
  })
  .put(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /campsites');
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.deleteMany()
      .then((response) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
      })
      .catch((err) => next(err));
  });

campsiteRouter
  .route('/:campsiteId')
  .get((req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate('comments.author')
      .then((campsite) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `POST operation not supported on /campsites/${req.params.campsiteId}`
    );
  })
  .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndUpdate(
      req.params.campsiteId,
      {
        $set: req.body,
      },
      { new: true }
    )
      .then((campsite) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
      })
      .catch((err) => next(err));
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndDelete(req.params.campsiteId)
      .then((response) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
      })
      .catch((err) => next(err));
  });

campsiteRouter
  .route('/:campsiteId/comments')
  .get((req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate('comments.author')
      .then((campsite) => {
        if (campsite) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(campsite.comments);
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then((campsite) => {
        if (campsite) {
          req.body.author = req.user._id;
          campsite.comments.push(req.body);
          campsite
            .save()
            .then((campsite) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(campsite);
            })
            .catch((err) => next(err));
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .put(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /campsites/${req.params.campsiteId}/comments`
    );
  })
  .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then((campsite) => {
        if (campsite) {
          for (let i = campsite.comments.length - 1; i >= 0; i--) {
            campsite.comments.id(campsite.comments[i]._id).remove();
          }
          campsite
            .save()
            .then((campsite) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(campsite);
            })
            .catch((err) => next(err));
        } else {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

campsiteRouter
  .route('/:campsiteId/comments/:commentId')
  .get((req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .populate('comments.author')
      .then((campsite) => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(campsite.comments.id(req.params.commentId));
        } else if (!campsite) {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .post(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(
      `POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`
    );
  })
  .put(authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then((campsite) => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          if (req.user._id === campsite.user._id) {
            if (req.body.rating) {
              campsite.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.text) {
              campsite.comments.id(req.params.commentId).text = req.body.text;
            }
            campsite
              .save()
              .then((campsite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
              })
              .catch((err) => next(err));
          } else {
            err = new Error('You are not authorized to update this comment');
            err.status = 403;
            return next(err);
          }
        } else if (!campsite) {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  })
  .delete(authenticate.verifyUser, (req, res, next) => {
    Campsite.findById(req.params.campsiteId)
      .then((campsite) => {
        if (campsite && campsite.comments.id(req.params.commentId)) {
          if (req.user._id === campsite.user._id) {
            campsite.comments.id(req.params.commentId).remove();
          campsite
            .save()
            .then((campsite) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(campsite);
            })
            .catch((err) => next(err));
          } else {
            err = new Error('You are not authorized to delete this comment');
            err.status = 403;
            return next(err);
          }
        } else if (!campsite) {
          err = new Error(`Campsite ${req.params.campsiteId} not found`);
          err.status = 404;
          return next(err);
        } else {
          err = new Error(`Comment ${req.params.commentId} not found`);
          err.status = 404;
          return next(err);
        }
      })
      .catch((err) => next(err));
  });

module.exports = campsiteRouter;

[
  {
      "featured": true,
      "_id": "63cc5357e9e338595ffa9771",
      "name": "Redux Woods Campground",
      "image": "images/redux-woods.jpg",
      "elevation": 42,
      "cost": 55,
      "description": "You'll never want to leave this hidden gem, deep within the lush Redux Woods.",
      "comments": [],
      "createdAt": "2023-01-21T21:04:23.037Z",
      "updatedAt": "2023-01-21T21:05:55.328Z",
      "__v": 3
  },
  {
      "featured": true,
      "_id": "63ccafc7b631586afa09acc9",
      "name": "Redux Woods Campgrounds",
      "image": "images/redux-woods.jpg",
      "elevation": 42,
      "cost": 55,
      "description": "You'll never want to leave this hidden gem, deep within the lush Redux Woods.",
      "comments": [
          {
              "_id": "63ccb003b631586afa09acce",
              "rating": 3,
              "text": "test comment",
              "author": {
                  "firstname": "alice",
                  "lastname": "johnson",
                  "admin": false,
                  "_id": "63ccaf7eb631586afa09acbf",
                  "username": "testuser",
                  "__v": 0
              },
              "createdAt": "2023-01-22T03:39:47.865Z",
              "updatedAt": "2023-01-22T03:39:47.865Z"
          }
      ],
      "createdAt": "2023-01-22T03:38:47.758Z",
      "updatedAt": "2023-01-22T03:39:47.865Z",
      "__v": 1
  }
]