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
const Consul = require('consul');
const rateRoutes = require('./src/routes/ratingRoutes.js')
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
app.use('/api/rate', rateRoutes);


app.get('/error', (req, res) => {
    throw new Error('This is a simulated error!');
  });


/* **********************server************************* */
const HTTP_PORT = 7000;
const HOST = process.env.HOST || 'localhost';


app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));


http.createServer(app).listen(HTTP_PORT, async () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);

/* **************************Register service with Consul************************* */
  try {
    await consul.agent.service.register({
      id: SERVICE_ID,
      name: 'rating-service',
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