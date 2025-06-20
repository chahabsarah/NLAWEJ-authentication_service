const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/RatingController');

router.post('/evaluate', RatingController.createEvaluation);

module.exports = router;
