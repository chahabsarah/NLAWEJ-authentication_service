const mongoose = require('mongoose');

const demandeSchema = new mongoose.Schema({
  typeService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  idHabitant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  statut: {
    type: String,
    enum: ['pending', 'closed'],
    default: 'pending'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Demande', demandeSchema);
