const mongoose = require('mongoose');

const PositionSchema = new mongoose.Schema({
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // à true car chaque position doit avoir un user
  }
});

PositionSchema.index({ coordinates: '2dsphere' });
PositionSchema.index({ userId: 1 });

module.exports = mongoose.model('Position', PositionSchema);
