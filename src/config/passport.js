const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config();

function handleSocialLogin(profile, done) {
  return async (accessToken, refreshToken, profileData, doneFn) => {
    try {
      const email = profile(profileData);
      if (!email) {
        return doneFn(null, false, { message: "No email associated with this account" });
      }

      let user = await User.findOne({ email });
      if (!user) {
        return doneFn(null, false, { message: "Access denied! User not found!" });
      }

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '48h' });
      const newRefreshToken = crypto.randomBytes(40).toString('hex');
      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

      user.refreshToken = hashedRefreshToken;
      user.refreshTokenExpiration = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days
      user.lastActivity = new Date();
      await user.save();

      doneFn(null, user);
    } catch (err) {
      doneFn(err, null);
    }
  };
}

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/auth/google/callback",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: ['profile', 'email']
  },
  handleSocialLogin(profile => profile.emails[0].value)
));
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/auth/github/callback",
    scope: ['user:email']
  },
  handleSocialLogin(profile => profile.emails?.[0]?.value)
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'photos']
  },
  handleSocialLogin(profile => profile.emails?.[0]?.value)
));


passport.serializeUser((user, done) => {
  done(null, user._id)
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
