const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
  ,
  serviceImage: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('Service', serviceSchema);
