const Projet = require('../models/Project');
const Invoice = require('../models/Invoice');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const fs = require('fs');
const PDFDocument = require('pdfkit');

const updateProjectFinalPrice= async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPrice } = req.body;

    const projet = await Projet.findById(id)
      .populate('artisan')
      .populate('habitant');

    if (!projet) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
if (finalPrice> projet.budget.max){
    return res.status(400).json({message : "le prix final dépasse le prix max validé par le client!"})
}
    projet.finalPrice = finalPrice;
    await projet.save();

    if (projet.finalPrice > 0) {
      const factureExistante = await Invoice.findOne({ projet: projet._id });

      if (!factureExistante) {
        const nouvelleFacture = new Invoice({
          projet: projet._id,
          habitant: projet.habitant._id,
          artisan: projet.artisan._id,
          montant: projet.finalPrice,
          statutPaiement: 'notpaid',
          numeroFacture: 'INV-' + uuidv4().split('-')[0].toUpperCase()
        });

        await nouvelleFacture.save();
      }
    }

    return res.status(200).json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updatePaiementStatus:', error.message);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
const updateProjectPaiementStatus= async (req, res) => {
  try {
    const { id } = req.params;
    const projet = await Projet.findById(id)
    if (!projet) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
if (projet.statutPaiement ==='paid'){
    return res.status(400).json({message : "projet deja payé"})
}
    projet.statutPaiement = 'paid';
    await projet.save();
    const inv = await Invoice.findOne({ projet: projet._id });
    if (!inv) {
     return res.status(404).json({ status: false, message: 'invoice introuvable pour ce projet' });
        }
    inv.statutPaiement = 'paid';
    inv.paiementMode = 'cash'
    await inv.save();
    return res.status(200).json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updatePaiementStatus:', error.message);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
const downloadInvoiceByProjectId = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findOne({ projet: id })
      .populate('habitant')
      .populate('artisan')
      .populate('projet');

    if (!invoice) {
      return res.status(404).json({ message: 'Facture non trouvée.' });
    }

    const doc = new PDFDocument();

    res.setHeader('Content-disposition', `attachment; filename=${invoice.numeroFacture}.pdf`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Facture', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Numéro de facture : ${invoice.numeroFacture}`);
    doc.text(`Date d'émission : ${new Date(invoice.dateEmission).toLocaleDateString()}`);
    doc.text(`Montant : ${invoice.montant} Dt`);
    doc.text(`Statut : ${invoice.statutPaiement}`);
    doc.moveDown();

    doc.text(`Projet : ${invoice.projet?.nom}`);
    doc.text(`Habitant : ${invoice.habitant?.fullName || 'N/A'}`);
    doc.text(`Artisan : ${invoice.artisan?.fullName || 'N/A'}`);

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la génération de la facture.' });
  }
};
const getInvoiceByProjectId = async (req, res) => {
  const { id } = req.params;

  try {
    const invoices = await Invoice.find({ projet: id })
      .populate('projet')
      .populate('habitant')
      .populate('artisan');

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des factures du projet.', error });
  }
};

const getInvoicesByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const invoices = await Invoice.find({
      $or: [{ habitant: userId }, { artisan: userId }]
    })
      .populate('projet')
      .populate('habitant')
      .populate('artisan');

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des factures de l’utilisateur.', error });
  }
};
const deleteInvoice = async (req, res) => {
  try {
    const paiement = await Invoice.findByIdAndDelete(req.params.id);
    if (!paiement) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    res.status(200).json({ message: 'Facture supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la facture :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { updateProjectFinalPrice ,updateProjectPaiementStatus,downloadInvoiceByProjectId,
getInvoicesByUserId,getInvoiceByProjectId,deleteInvoice};
