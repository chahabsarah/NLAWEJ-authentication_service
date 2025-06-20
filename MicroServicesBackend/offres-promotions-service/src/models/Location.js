const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }
});

// Crée un index 2dsphere pour permettre les requêtes géospatiales
LocationSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Location', LocationSchema);
