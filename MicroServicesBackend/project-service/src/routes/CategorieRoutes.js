const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/CategorieController');

router.post('/add', categorieController.createCategorie);
router.get('/categories', categorieController.getAllCategories);
router.get('/getById/:id', categorieController.getCategorieById);
router.get('/getServicesBycatId/:id', categorieController.getServicesByCategorieById);
router.put('/update/:id', categorieController.updateCategorie);
router.delete('/delete/:id', categorieController.deleteCategorie);

module.exports = router;
