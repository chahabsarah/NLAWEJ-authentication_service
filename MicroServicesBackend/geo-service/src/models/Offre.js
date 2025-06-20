const mongoose = require('mongoose');
const OfferSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  duration:{
    type : Number ,
    required: true,
  },
  artisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
location: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Location',
  required: true
},
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

OfferSchema.virtual('expiresAt').get(function () {
  return new Date(this.createdAt.getTime() + this.duration * 24 * 60 * 60 * 1000);
});

OfferSchema.methods.toggleLike = function(userId) {
  const index = this.likes.indexOf(userId);
  if (index === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(index, 1);
  }
  return this.save();
};
module.exports = mongoose.model('Offer', OfferSchema);
