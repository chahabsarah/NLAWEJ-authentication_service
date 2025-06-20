const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  services: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }
  ]
});

module.exports = mongoose.model('Categorie', categorieSchema);
