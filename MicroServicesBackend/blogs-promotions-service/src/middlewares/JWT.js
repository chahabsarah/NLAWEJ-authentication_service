const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');

/* ***************************************auth user by token start ******************************** */
const authenticateUserByJwt = (req, res, next) => {
  try {
    //extracting token from the Authorization header in incoming request
    let token = req.header("Authorization");
    //if no token is provided in Authorization header 
    if (!token) {
      return res.status(401).json({ msg: "token missing " });
    }
/*if it starts with "Bearer ",the authentificateUserByJwt
 slices it from index 7 to the end so only the jwt part remains*/
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }
  //verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ msg: "invalid token" });
      }
      /*verifying if id , email and  role are attached to when decoding the token */
      if (!decoded.id) {
        return res.status(400).json({ msg: "user id missing when decoding token" });
      }
      const user = await User.findById(decoded.id);
      if (!user){
        return res.status(404).json({ msg: "User not found" });
      }
      if (!decoded.email) {
        return res.status(400).json({ msg: "user email missing when decoding token" });
      }
      if (!decoded.role) {
        return res.status(400).json({ msg: "user role missing when decoding token" });
      }
      const now = new Date();
      const inactiveTime = (now - user.lastActivity) / (1000 * 60);
      // log out user after 15 min of inactivity
      // if (inactiveTime > 120) {
      //   user.refreshToken = null;
      //   await user.save();
      //   return res.status(401).json({ msg: "session expired due to inactivity. Please log in again." });
      // }
      // update user's last activity
      user.lastActivity = now;
      await user.save();
    //attaching user information to the request object
      req.user = { id: decoded.id, email : decoded.email , role : decoded.role };
      next();
    });
  } catch (err) {
    console.error("authentication error :", err);
    return res.status(500).json({ msg: "server error" });
  }
};
/* ***************************************auth user by token end ******************************** */

/* *****************************refreshing token start ********************************************* */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Find user by refresh token
    const user = await User.findOne({ refreshToken: { $exists: true } });
    if (!user) {
      return res.status(400).json({ msg: 'not found refresh token' });
    }

    // Verify refresh token by comparing it with the hashed token stored in mangodb
    const isSame = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isSame) {
      return res.status(400).json({ msg: 'Invalid refresh token enc' });
    }
    const now = new Date();
    const inactiveTime = (now - user.lastActivity) / (1000 * 60);
    // if (inactiveTime > 120) {
    //   user.refreshToken = null;
    //   await user.save();
    //   return res.status(401).json({ msg: "session expired due to inactivity. Please log in again." });
    // }
    // Generate a new access token
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '48h' }
    );
    user.lastActivity = now;
    await user.save();
    // Send the new access token to the client side
    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error('refresh token error:', err);
    return res.status(500).json({ msg: 'server error.' });
  }
};
/* *****************************refreshing token end ********************************************* */

module.exports = { authenticateUserByJwt,refreshAccessToken };
