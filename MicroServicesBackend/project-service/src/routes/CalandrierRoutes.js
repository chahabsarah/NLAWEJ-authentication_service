const express = require('express');
const router = express.Router();
const calendrierController = require('../controllers/CalendrierController');


router.post('/add/:id', calendrierController.ajouterCreneau);
router.put('/:id/choisir-creneau/:creneauId', calendrierController.choisirCreneau);
router.get('/by-devis/:devisId',calendrierController.getCalendrierByDevisId);
router.get('/creneaux/:calenderId', calendrierController.getCreneauxByCalendrierId);
router.put('/:id/creneaux/:creneauId', calendrierController.modifierCreneau);
router.delete('/:id/creneaux/:creneauId', calendrierController.supprimerCreneau);
module.exports = router;
