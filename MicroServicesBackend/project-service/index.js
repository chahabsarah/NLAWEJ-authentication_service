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
const ServiceRoutes = require('./src/routes/ServiceRoutes');
const CategorieRoutes = require('./src/routes/CategorieRoutes');
const DemandeRoutes = require('./src/routes/DemandeRoutes.js');
const DevisRoutes = require('./src/routes/DevisRoutes.js');
const CalendrierRoutes = require('./src/routes/CalandrierRoutes.js');
const projectRoutes = require('./src/routes/ProjectRoutes');
const Consul = require('consul');
const Devis = require('./src/models/Devis.js');
const Project = require('./src/models/Project.js');
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

app.use("/api/service", ServiceRoutes);
app.use('/api/categorie', CategorieRoutes);
app.use('/api/demande', DemandeRoutes);
app.use('/api/devis', DevisRoutes);
app.use('/api/calendrier', CalendrierRoutes);
app.use('/api/project', projectRoutes);

/* **********************server************************* */
const HTTP_PORT = 4000;
const HOST = process.env.HOST || 'localhost';


app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.get('/api/project/:id/quote', async (req, res) => {
  const projectId = req.params.id;
 const project = await Project.findById(projectId);
 console.log("project",project)
 if(!project){
  return res.status(404).sendStatus("project not found");
 }

  try {
    const devis = await Devis.findById(project.devis)
      .populate('artisan','fullName email')
      .populate('habitant')
      .populate('demande');

    if (!devis) {
      return res.status(404).send("Devis non trouvé");
    }
 console.log("devis",devis)

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Quote_${projectId}.pdf"`);

    doc.pipe(res);

    // Couleurs & style
    const blue = '#007BFF';
    const white = '#FFFFFF';
    const gray = '#F8F9FA';

    // En-tête
    doc
      .fillColor(white)
      .rect(0, 0, doc.page.width, 80)
      .fill(blue)
      .fontSize(26)
      .fillColor(white)
      .text("FACTURE", 50, 25, { align: 'left' })
      .fontSize(12)
      .text(`Facture ID: ${devis._id}`, 50, 55, { align: 'left' })
      .text(`Date: ${new Date(devis.createdAt).toLocaleDateString()}`, { align: 'right' });

    doc.moveDown(3);

    // Infos Client & Artisan
    doc
      .fillColor('black')
      .fontSize(14)
      .text(`Client: ${devis.habitant?.fullName || 'Nom inconnu'}`)
      .text(`Artisan: ${devis.artisan?.fullName || 'Nom inconnu'}`)
      .moveDown();

    doc
      .fontSize(14)
      .fillColor(blue)
      .text('Détails du devis', { underline: true })
      .moveDown(0.5)
      .fillColor('black')
      .text(`Prix minimum estimé : ${devis.prixMin} €`)
      .text(`Prix maximum estimé : ${devis.prixMax} €`)
      .text(`Durée estimée des travaux : ${devis.dureeTravail} jours`)
      .moveDown();

    // Matériaux
    if (devis.materiaux.length > 0) {
      doc
        .fillColor(blue)
        .text('Matériaux inclus', { underline: true })
        .moveDown(0.5)
        .fillColor('black');

      devis.materiaux.forEach((m, index) => {
        doc.text(`- ${m.nom} ${m.description ? `: ${m.description}` : ''}`);
      });
      doc.moveDown();
    }

    // Pied de page
    doc
      .moveDown(2)
      .fontSize(10)
      .fillColor(gray)
      .text('Merci pour votre confiance.', {
        align: 'center'
      });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la génération de la facture.");
  }
});
http.createServer(app).listen(HTTP_PORT, async () => {
  console.log(`HTTP Server running on port ${HTTP_PORT}`);

/* **************************Register service with Consul************************* */
  try {
    await consul.agent.service.register({
      id: SERVICE_ID,
      name: 'project-service',
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