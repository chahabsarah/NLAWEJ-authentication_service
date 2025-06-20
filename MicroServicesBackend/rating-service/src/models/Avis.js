const mongoose = require('mongoose');

const avisSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Avis', avisSchema);
