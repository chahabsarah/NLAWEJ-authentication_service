const express = require('express');
const router = express.Router();
const devisController = require('../controllers/DevisController');

router.post('/add/:habitant/:artisan', devisController.createDevis);
router.get('/devis', devisController.getAllDevis);
router.get('/getById/:id', devisController.getDevisById);
router.put('/update/:id', devisController.updateDevis);
router.delete('/delete/:id', devisController.deleteDevis);
router.get('/GetByDemande/:demandeId', devisController.getDevisByDemande);
router.put('/accepter/:devisId', devisController.accepterDevis);
router.get('/demande/:demandeId/user/:userId', devisController.getDevisByDemandeAndUser);

module.exports = router;
