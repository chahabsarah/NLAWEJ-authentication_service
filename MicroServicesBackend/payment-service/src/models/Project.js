const mongoose = require('mongoose');
const workflowEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  photoAvant: {
    type: String,
    required: false
  },
  photoApres: {
    type: String,
    required: false
  },
  commentaire: {
    type: String,
    default: ''
  }
}, { _id: false });
const projetSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  habitant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dureeTravail: { type: Number, required: true },
  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  devis: { type: mongoose.Schema.Types.ObjectId, ref: 'Devis', required: true },
  statutPaiement: {
    type: String,
    enum: ['paid', 'notpaid'],
    default: 'notpaid'
  },
    calenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'CalendrierTravail', required: true },

  statutProjet: {
    type: String,
    enum: ['pending', 'active', 'done'],
    default: 'pending'
  },
   workflow: {
    type: [workflowEntrySchema],
    default: []
  },
  finalPrice: { 
    type: Number,
    default: 0,
  },

}, {
  timestamps: true
});

module.exports = mongoose.model('Projet', projetSchema);
