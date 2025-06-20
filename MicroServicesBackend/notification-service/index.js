const express = require('express');
const http = require('http');
const fs = require('fs');
const PDFDocument = require('pdfkit');
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
const globalNotificationRoutes = require('./src/routes/globalNotificationRoutes.js');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST","PUT", "DELETE"]
  }
});
// Stockage des sockets utilisateurs
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("Nouvelle connexion socket:", socket.id);

  socket.on("joinUser", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} joined socket room with socket ID ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log("Déconnexion:", socket.id);
    for (let [userId, id] of connectedUsers.entries()) {
      if (id === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

// Attache à app pour l'utiliser dans les contrôleurs
app.set('io', io);
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

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
  });
app.get('/error', (req, res) => {
    throw new Error('This is a simulated error!');
  });
app.get('/ping', (req, res) => {
  res.send(`Pong from ${process.env.SERVICE_ID || 'unknown instance'}`);
});

/* **********************server************************* */
const HTTP_PORT = 5002;
const HOST = process.env.HOST || 'localhost';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use('/api/notification/', globalNotificationRoutes);


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
      name: 'notification-service',
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