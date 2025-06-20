const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema({
  artisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  periode: {
    type: String,
    enum: ['mensuel', 'annuel'],
    required: true
  },
  montant: {
    type: Number,
    required: true
  },
  dateDebut: {
    type: Date,
    required: true,
    default: Date.now
  },
  dateFin: {
    type: Date,
    required: true
  },
  statut: {
    type: String,
    enum: ['actif', 'expire'],
    required: true,
    default: 'expire'
  },
  referencePaiement: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },

});

module.exports = mongoose.model('Abonnement', abonnementSchema);