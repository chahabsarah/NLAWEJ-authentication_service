const express = require('express');
const axios = require('axios');
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
const User = require('./src/models/User');
const Devis = require('./src/models/Devis');
const Abonnement = require('./src/models/Abonnement');
const invoiceRoutes = require('./src/routes/InvoiceRoutes.js');
const abonnementRoutes = require('./src/routes/AbonnementRoutes.js')

const PAYMEE_API_KEY = process.env.PAYMEE_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const RETURN_URL = process.env.RETURN_URL;
const CANCEL_URL = process.env.CANCEL_URL;
const PAYMEE_API_URL = process.env.PAYMEE_API_URL;

const Consul = require('consul');
const Project = require('./src/models/Project.js');
const Invoice = require('./src/models/Invoice.js');

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
;
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
  });
app.get('/c', (req, res) => {
    res.status(200).json({ status: 'hello from c' });
  });

app.get('/error', (req, res) => {
    throw new Error('This is a simulated error!');
  });
app.post('/api/paymee/create-payment/:devisId', async (req, res) => {
  try {
    const { devisId } = req.params;
    const devis = await Devis.findById(devisId).populate('habitant');

    if (!devis) {
      return res.status(404).json({ message: 'Devis non trouvé' });
    }

    const habitant = devis.habitant;

     const projet = await Project.findOne({ devis: devis._id });
        if (!projet) {
            return res.status(404).json({ status: false, message: 'Projet introuvable pour ce devis' });
            }
    const montant = projet.finalPrice;
    const payload = {
      vendor: 'PAYMEE_TN',
      amount: montant,
      note: `Paiement pour le devis ${devis._id}`,
      first_name: habitant.fullName?.split(' ')[0] || 'Client',
      last_name: habitant.fullName?.split(' ')[1] || 'Client',
      email: habitant.email,
      phone: habitant.phone,
      webhook_url: WEBHOOK_URL,
      return_url: RETURN_URL,
      cancel_url: CANCEL_URL,
      order_id: devis._id.toString()
    };

    const response = await axios.post(PAYMEE_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: PAYMEE_API_KEY
      }
    });

    console.log('Réponse complète Paymee:', response.data);
    res.status(200).json(response.data);
    if (response.data.message =='Success'){
      const projet = await Project.findOne({ devis: devis._id });
        if (!projet) {
            return res.status(404).json({ status: false, message: 'Projet introuvable pour ce devis' });
            }
         projet.statutPaiement = 'paid';
      await projet.save();
      const inv = await Invoice.findOne({ projet: projet._id });
      if (!inv) {
            return res.status(404).json({ status: false, message: 'invoice introuvable pour ce projet' });
            }
         inv.statutPaiement = 'paid';
         inv.paiementMode = 'card'
      await inv.save();
      console.log(`Paiement confirmé, projet ${projet.nom} mis à jour avec statutPaiement = "paid"`);
    } 
  } catch (err) {
    console.error('Erreur lors du paiement :', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
/* ******abonnemment part******** */
app.post('/api/paymee/create-subscription-payment/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { periode } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (user.role !== 'artisan') return res.status(403).json({ message: 'Réservé aux artisans' });

    let montant;
    switch (periode) {
      case 'mensuel':
        montant = 30;
        break;
      case 'annuel':
        montant = 300;
        break;
      default:
        return res.status(400).json({ message: 'Période invalide' });
    }

    const payload = {
      vendor: 'PAYMEE_TN',
      amount: montant,
      note: `Abonnement ${periode} pour artisan ${user.fullName}`,
      first_name: user.fullName?.split(' ')[0],
      last_name: user.fullName?.split(' ')[1],
      email: user.email,
      phone: user.phone,
      webhook_url: process.env.WEBHOOK_URL_SUB,
      return_url: process.env.RETURN_URL_SUB,
      cancel_url: process.env.CANCEL_URL_SUB,
      order_id: `SUB-${Date.now()}-${userId}`
    };

    const response = await axios.post(PAYMEE_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: PAYMEE_API_KEY
      }
    });

    // Sauvegarde provisoire en statut "expire"
    const abonnement = new Abonnement({
      artisan: userId,
      periode,
      montant,
      referencePaiement: payload.order_id,
      dateDebut: new Date(),
      dateFin: new Date(),
      statut: 'expire'
    });
    await abonnement.save();
    user.hasSubscription = false;
    await user.save();

    console.log('Réponse complète Paymee:', response.data);

    // Met à jour localement l'abonnement s'il est déjà "Success"
    if (response.data.message === 'Success') {
      const dateDebut = new Date();
      const dateFin = new Date(dateDebut);
      if (periode === 'mensuel') dateFin.setMonth(dateFin.getMonth() + 1);
      else dateFin.setFullYear(dateFin.getFullYear() + 1);

      abonnement.dateDebut = dateDebut;
      abonnement.dateFin = dateFin;
      abonnement.statut = 'actif';
      await abonnement.save();

      user.hasSubscription = true;
      user.subscription = abonnement._id;
      await user.save();
  await User.updateMany(
    { role: "admin" },
    { $inc: { income: abonnement.montant } }
  );
      console.log(`Abonnement ${abonnement._id} activé`);
    }

    // ⚠️ Ne renvoyer la réponse qu'une seule fois
    return res.status(200).json(response.data);

  } catch (err) {
    console.error('Erreur paiement abonnement:', err.response?.data || err.message);
    return res.status(500).json({
      message: 'Erreur création paiement',
      error: err.response?.data || err.message
    });
  }
});

/* **********************server************************* */
const HTTP_PORT = 6005;
const HOST = process.env.HOST || 'localhost';
app.use('/paiement',invoiceRoutes)
app.use('/abonnement',abonnementRoutes);
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
      name: 'payment-service',
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