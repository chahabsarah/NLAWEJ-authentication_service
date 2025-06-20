const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const User = require("../models/User");

/* ********************************************* verify the 2FA code start ************************************* */
const verify2FAToken = (secret, code) => {

    const isValid = speakeasy.totp.verify({
      // user secret key
    secret : secret,
    encoding: "base32",
    // 2FA code that the user  write
    token :code,
  });
  return isValid;
};
/* ********************************************* verify the 2FA code end ************************************* */

/* *********************************generate a 2FA code  and a QR code start ***************************** */
const generate2FASecret = async (user) => {
  // generate secret key
  const secret = speakeasy.generateSecret({
     // app name
    name: "MyApp",
    // secret key length
    length: 20,
  });

  // Store user's secret key
  user.twofa_secret = secret.base32;
  await user.save();

  // generate QR code
  const otpauth_url = secret.otpauth_url;
  const qrCode = await qrcode.toDataURL(otpauth_url);

  return { qrCode, secret };
};
/* *********************************generate a 2FA code  and a QR code end ***************************** */

/* *********************************sending QR code end ***************************** */
const setup2FA = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const { qrCode, secret } = await generate2FASecret(user);
      // senging the QR code
      return res.status(200).json({
        msg: "2FA setup success",
        qrCode,
        secret: secret.base32,
      });
    } catch (error) {
      console.error("config error:", error);
      return res.status(500).json({ msg: "server error" });
    }
  };
/* *********************************sending QR code end ***************************** */

module.exports={ verify2FAToken , generate2FASecret , setup2FA }

