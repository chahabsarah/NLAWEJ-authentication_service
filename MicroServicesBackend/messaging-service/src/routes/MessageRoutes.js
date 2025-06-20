const express = require('express');
const router = express.Router();
const messageController = require('../controllers/MessageController');

router.get('/get', messageController.getMessages);
router.post('/send', messageController.sendMessage);
router.get('/messagesByUser', messageController.getMessagesByUserId);
router.get('/discByUser', messageController.getMessagesByUserId);

module.exports = router;
