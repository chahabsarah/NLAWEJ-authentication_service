const Discussion = require("../models/Discussion");
const Message = require("../models/Message");


const sendMessage = async (req, res) => {
  const { text, sender, receiver } = req.body;

  try {
    const newMessage = new Message({ text, sender, receiver });
    const savedMessage = await newMessage.save();

    let discussion = await Discussion.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    });

    if (!discussion) {
      discussion = new Discussion({ sender, receiver, messages: [] });
    }

    discussion.messages.push({ text });
    await discussion.save();

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending message:', error.message);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};
const getMessages = async (req, res) => {
  const { senderId, receiverId } = req.query;

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: 'Sender and receiver IDs are required.' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error.message);
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};
const getMessagesByUserId = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Failed to fetch messages by userId:', error.message);
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};
const getDiscussionsByUser = async (req, res) => {
  const { userId } = req.query;

  try {
    const discussions = await Discussion.find({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    res.status(200).json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch discussions', error: error.message });
  }
};

module.exports={getMessages,sendMessage,getMessagesByUserId,getDiscussionsByUser}