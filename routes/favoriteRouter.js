const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
cors = require('./cors');
const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200)})
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOne({ 'user': req.user._id })
  .populate('user')
  .populate('dishes')
  .then((favorites) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(favorites);
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOne( {'user': req.user._id}, ( err, favorites ) => {
    if (err) return next(err);
    if (favorites == null){
      Favorites.create( {'user': req.user._id, 'dishes': req.body} )
      .then((favorites) => {
        Favorites.findById(favorites._id)
        .populate('user')
        .populate('dishes')
        .then((favorites) => {
          console.log('New dishes added as favorites: ', favorites);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorites);
        })
      }, (err) => next(err))
      .catch((err) => next(err));
    }
    else {
      for(i = 0; i < req.body.length; i++){
        if (favorites.dishes.indexOf(req.body[i]._id) == -1){
          favorites.dishes.push(req.body[i]._id)
        }
      }
      favorites.save()
      .then((favorite) =>{
        Favorites.findById(favorite._id)
        .populate('user')
        .populate('dishes')
        .then((favorite)=>{
          res.StatusCode=200;
          res.setHeader('Content-Type','application/json');
          res.json(favorite);
        })
      })
      .catch((err) => next(err))
    }

  })
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOneAndDelete({user:req.user._id}, (err, resp) => {
    if (err) return next(err)
    else
    {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(resp);
    }
  });
});


favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200)})
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOne({ user: req.user._id })
  .then((favorites) => {
    if (!favorites){
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({"exists": false, "favorites": favorites})
    }
    else {
      if (favorites.dishes.indexOf(req.params.dishId) < 0) {
        // specific dish is not in favorites
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.json({"exists": false, "favorites": favorites})
      }
      else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.json({"exists": true, "favorites": favorites})
      }
    }
  }, (err) => next(err))
  .catch((err) => next(err))
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOne({"user": req.user._id})
  .then((favorites) => {
    if (favorites) {
      if (favorites.dishes.indexOf(req.params.dishId) === -1) {
        favorites.dishes.push(req.params.dishId);
        favorites.save()
        .then((favorites) => {
          Favorites.findById(favorites._id)
          .populate('user')
          .populate('dishes')
          .then((favorites) => {
            console.log('New dishes added as favorites: ', favorites);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
          })
        })
        .catch((err) => next(err));
      }
      else {
        err = new Error('Already exists in favorites:' + req.params.dishId);
        err.status = 404;
        return next(err);
      }
    }
    else {
      Favorites.create({ user: req.user._id, dishes: [req.params.dishId]})
      .then((favorites) => {
        Favorites.findById(favorites._id)
        .populate('user')
        .populate('dishes')
        .then((favorites) => {
          console.log('favorites created: ', favorites);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorites);
        })
      })
      .catch((err) => next(err));
    }
  })
  .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOne({'user': req.user._id})
  .then((favorites) => {
    if (favorites.dishes.indexOf(req.params.dishId) === -1) {
      err = new Error('Does not exist in favorites:' + req.params.dishId)
      err.status = 404;
      return next(err);
    }
    else {
      favorites.dishes = favorites.dishes.filter(id => id != req.params.dishId)
      favorites.save()
        .then((favorites) => {
          Favorites.findById(favorites._id)
          .populate('user')
          .populate('dishes')
          .then((favorites) => {
            console.log('Deleted favorites: ', favorites);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
          })
      })
      .catch((err) => next(err));
    }
  })
  .catch((err) => next(err));
});


module.exports = favoriteRouter;
