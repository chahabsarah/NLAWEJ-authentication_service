const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, 'Invalid email']
  },
  password: {
    type: String,
    required: true
  },
  passwordHistory: [String],
    cin: { 
    type: String,
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String, 
    enum: ['admin', 'artisan', 'habitant'], 
    required: true,
    default: 'habitant'
  },
    AccountStatus:{
    type: String,
    enum: ['Pending', 'Active','Archived','Inactive'],
    default:'Pending'
  },
  profileImage: {
    type: String,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  }
  ,
  refreshToken: {
    type: String
  },
  refreshTokenExpiration: {
     type: Date 
    },
  bio: {
    type: String,
    default: null,
  },
  fbLink: {
    type: String,
    default: null,
  },
  linkedInLink: {
    type: String,
    default: null,
  },
  instaLink: {
    type: String,
    default: null,
  },
  failedAttempts :{
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  twofa_secret :{
    type:String,
  },
  trustDeviceCode :{
    type : String,
  },
  trustDeviceCodeExpriation :{
    type: Date,
  },
  favoriteArtisans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  preferences: [String],
  cv: String,
  speciality: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  score: Number,
subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Abonnement', default: null }

  
}, 
);


module.exports = mongoose.model('User', userSchema);
