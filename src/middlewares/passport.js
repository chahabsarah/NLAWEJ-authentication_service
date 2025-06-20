const passport = require('passport');
require("../config/passport");

module.exports = {
  initialize: passport.initialize(),
  session: passport.session()
};
