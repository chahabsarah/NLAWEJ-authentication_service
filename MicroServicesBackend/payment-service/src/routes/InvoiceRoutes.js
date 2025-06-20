const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/InvoiceController');

router.put('/updateProjectFinalPrice/:id',invoiceController.updateProjectFinalPrice);
router.put('/updateProjectPaiementStatus/:id',invoiceController.updateProjectPaiementStatus);
router.get('/invoice/download/:id', invoiceController.downloadInvoiceByProjectId);
router.get('/project/:id', invoiceController.getInvoiceByProjectId);
router.get('/user/:userId', invoiceController.getInvoicesByUserId);
router.delete('/delete/:id',invoiceController.deleteInvoice)
module.exports = router;
