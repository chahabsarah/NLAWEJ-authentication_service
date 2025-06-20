const express = require('express');
const http = require('http');
require('dotenv').config();
const mongoose = require('mongoose');
const app = express();
const cors = require("cors");
const helmetMiddleware = require('./src/middlewares/helmet.js');
const rateLimiter = require('./src/middlewares/rateLimiter.js');
const corsOptions = require('./src/middlewares/cors.js');
const {errorHandler,logger} = require('./src/middlewares/errorHandler.js');
const path = require('path');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const messageRoutes = require('./src/routes/MessageRoutes.js');
const Consul = require('consul');
const consul = new Consul({
  host: 'consul',
  port: 8500
});
const SERVICE_ID = process.env.SERVICE_ID 
/* **********************mongodb connexion ************************* */
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 50000,
    serverSelectionTimeoutMS: 50000,
    family: 4,
    socketTimeoutMS: 50000,
    retryWrites: true,
    w: 'majority'
})
.then(() => console.log('connected to database!'))
.catch(err => console.error("can't connect to database", err));

/* **********************middlewares************************* */
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(rateLimiter)
app.use(helmetMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,}));
app.use(passport.initialize());
app.use(passport.session());
app.use(errorHandler);

/* ******************************routes************************ */
/* *******this routes is to test cors via jest************** */
app.get('/ping', (req, res) => {
  res.send(`Pong from ${process.env.SERVICE_ID || 'unknown instance'}`);
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
  });
app.get('/c', (req, res) => {
    res.status(200).json({ status: 'hello from c' });
  });
app.get('/error', (req, res) => {
    throw new Error('This is a simulated error!');
  });
app.use('/api/messages', messageRoutes);


/* **********************server************************* */

// Configuration de Socket.IO
const socketIo = require('socket.io');
const Message = require('./src/models/Message.js');
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
// Gestion des connexions Socket.IO
// Dans votre configuration Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Rejoindre une room spécifique à l'utilisateur
  socket.on('joinUser', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Gestion des messages
  socket.on('sendMessage', async (msgData) => {
    try {
      const newMessage = new Message({
        text: msgData.text,
        sender: msgData.sender,
        receiver: msgData.receiver,
      });

      const savedMessage = await newMessage.save();
      
      // Envoyer au destinataire
      io.to(msgData.receiver).emit('receiveMessage', savedMessage);
      // Envoyer aussi à l'expéditeur (pour synchronisation)
      io.to(msgData.sender).emit('receiveMessage', savedMessage);
      
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const HTTP_PORT = 4007;
const HOST = process.env.HOST || 'localhost';


app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));


server.listen(HTTP_PORT, async () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);

/* **************************Register service with Consul************************* */
  try {
    await consul.agent.service.register({
      id: SERVICE_ID,
      name: 'messaging-service',
      address: HOST,
      port: HTTP_PORT,
      tags: ['http'],
      check: {
        http: `http://${HOST}:${HTTP_PORT}/health`,
        interval: '10s',
        timeout: '5s'
      }
    });
    console.log(`Service registered successfully with Consul! ID: ${SERVICE_ID}`);
  } catch (error) {
    console.error('Failed to register service with Consul:', error.message);
  }
});
module.exports = app;