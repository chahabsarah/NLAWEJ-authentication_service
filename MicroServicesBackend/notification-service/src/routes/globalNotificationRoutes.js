const express = require('express');
const router = express.Router();
const globalNotificationController = require('../controllers/globalNotificationController');

router.post('/create', globalNotificationController.create);
router.get('/all', globalNotificationController.list);
router.delete('/:notificationId', globalNotificationController.deleteNotification);
router.get('/getByUser',globalNotificationController.listForUser);
router.put('/:notificationId/read',globalNotificationController.markAsRead);
module.exports = router;