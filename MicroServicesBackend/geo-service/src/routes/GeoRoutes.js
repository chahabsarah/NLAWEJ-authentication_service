const express = require('express');
const router = express.Router();
const geoController = require('../controllers/GeoController');

// /api/geo/distance?from=Tunis&to=Sfax
router.get('/distance', geoController.calculateDistance);
router.get('/cities', geoController.getAllCities);
router.get('/countries', geoController.getCities);

// /api/geo/offers-near-city?cityName=Sousse&maxDistance=10000
router.get('/offers-near-city', geoController.getOffersNearCity);
router.post('/save-location',geoController.saveUserLocation);
router.get('/offers-near-user', geoController.getOffersNearUser);

module.exports = router;
