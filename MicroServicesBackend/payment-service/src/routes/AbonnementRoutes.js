const express = require('express');
const router = express.Router();
const abonnementController = require('../controllers/AbonnementController');

router.get('/:userId/subscription', abonnementController.getUserSubscription);
router.get('/:subId', abonnementController.getSubscriptionById);

module.exports = router;