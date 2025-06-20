const express = require('express');
const router = express.Router();
const demandeController = require('../controllers/DemandeController');

router.post('/add/:idHabitant', demandeController.createDemande);
router.get('/demandes', demandeController.getAllDemandes);
router.get('/getById/:id', demandeController.getDemandeById);
router.put('/update/:id', demandeController.updateDemande);
router.delete('/delete/:id', demandeController.deleteDemande);
router.get('/getByUserId/:userId', demandeController.getDemandeByUserId);

module.exports = router;
