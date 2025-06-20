const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
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
  rate: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  avis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Avis',
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
