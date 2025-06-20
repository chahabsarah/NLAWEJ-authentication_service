const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
const { upload } = require('../controllers/ServiceController');

router.post('/workflow/:projetId/add', upload.fields([
  { name: 'photoAvant', maxCount: 1 },
  { name: 'photoApres', maxCount: 1 }
]),projectController.ajouterWorkflow);
router.get('/projects', projectController.getProjets);
router.get('/GetByUserId/:userId', projectController.getProjetsParUserId);
router.get('/getByProjectId/:id', projectController.getProjetParId);
router.put('/updateProjectStatus/:id', projectController.updateStatutProjet);
router.get('/by-devis/:devisId', projectController.getProjetByDevisId);
module.exports = router;
