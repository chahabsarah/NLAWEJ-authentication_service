const mongoose = require('mongoose');

const creneauSchema = new mongoose.Schema({
  date: Date,
  heureDebut: String,
  heureFin: String,
  choisiParHabitant: {
    type: Boolean,
    default: false
  }
});

const calendrierTravailSchema = new mongoose.Schema({
  devis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devis',
    required: true,
    unique: true
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
  dureeTravail: {
    type: Number, // en jours
    required: true
  },
  creneaux: [creneauSchema],

  statut: {
    type: String,
    enum: ['en_attente_creneaux', 'en_attente_choix', 'validé'],
    default: 'en_attente_creneaux'
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('CalendrierTravail', calendrierTravailSchema);
