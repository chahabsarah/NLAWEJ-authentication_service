const mongoose = require('mongoose');

const devisSchema = new mongoose.Schema({
  demande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Demande',
    required: true
  },
  artisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  habitant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prixMin: {
    type: Number,
    required: true
  },
  prixMax: {
    type: Number,
    required: true
  },
  dureeTravail: {
    type: Number,
    required: true
  },
  materiaux: [
    {
      nom: { type: String, required: true },
      description: { type: String }
    }
  ],
  status:{
    type: String,
    enum : ['pending','accepted','rejected'],
    default:'pending',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Devis', devisSchema);
