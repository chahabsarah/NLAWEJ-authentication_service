const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  projet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Projet',
    required: true
  },
  habitant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  artisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  montant: {
    type: Number,
    required: true
  },
  statutPaiement: {
    type: String,
    enum: ['paid', 'notpaid'],
    default: 'notpaid'
  },
  dateEmission: {
    type: Date,
    default: Date.now
  },
  numeroFacture: {
    type: String,
    unique: true,
    required: true
  },
    paiementMode: {
    type: String,
    enum: ['card', 'cash'],
    default: 'cash'
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
