// 1. Dans votre service offres (paste.txt) - Correction de la configuration Socket.IO
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
const offreRoutes = require('./src/routes/OffreRoutes')
const Consul = require('consul');

// Configuration MongoDB
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

// Configuration des middlewares
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(rateLimiter)
app.use(helmetMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes de santé
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

app.get('/c', (req, res) => {
    res.status(200).json({ status: 'hello from c' });
});
app.get('/ping', (req, res) => {
  res.send(`Pong from ${process.env.SERVICE_ID || 'unknown instance'}`);
});

// Configuration CORS additionnelle
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Routes
app.use('/api/offre', offreRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Création du serveur HTTP
const server = http.createServer(app);

// Configuration Socket.IO APRÈS la création du serveur
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  path: "/socket.io",
  transports: ['websocket', 'polling'], // Ajout de polling comme fallback
  pingTimeout: 60000,
  pingInterval: 25000
});

// Stockage des utilisateurs connectés par rôle
const connectedUsers = new Map(); // userId -> socket
const userRoles = new Map(); // userId -> role

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Nouveau client connecté:', socket.id);

  // Gestion de l'authentification utilisateur
  socket.on('joinUser', (userId) => {
    connectedUsers.set(userId, socket);
    socket.userId = userId;
    console.log(`User ${userId} connecté avec socket ${socket.id}`);
    
    // Ici vous pourriez récupérer le rôle de l'utilisateur depuis la base de données
    // et le stocker dans userRoles
  });

  // Gestion des rooms par rôle
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} a rejoint la room ${room}`);
  });

  // Gestion des nouvelles offres
  socket.on('new-offre', (data) => {
    // Diffuser à tous les habitants connectés
    socket.broadcast.emit('new-offre-notification', data);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      userRoles.delete(socket.userId);
    }
  });
});

// Rendre io accessible dans l'application
app.set('socketio', io);

// Configuration du serveur
const HTTP_PORT = 5068;
const HOST = process.env.HOST || 'localhost';

server.listen(HTTP_PORT, async () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);

  // Enregistrement avec Consul
  const consul = new Consul({
    host: 'consul',
    port: 8500
  });
  
  const SERVICE_ID = process.env.SERVICE_ID;
  
  try {
    await consul.agent.service.register({
      id: SERVICE_ID,
      name: 'offres-promotions-service',
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

app.use(errorHandler);
module.exports = app;