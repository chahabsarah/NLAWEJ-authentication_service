const bcrypt = require('bcryptjs');

/* *********************verify password start************ */
const isPasswordValid = async function(password) {
  return await bcrypt.compare(password, this.password);
};
/* *********************verify password start************ */

/* *********************reset password start************ */
const resetPassword = async function (currentPassword, newPassword) {
  const isValid = await this.isPasswordValid(currentPassword);
  if (!isValid) {
    throw new Error("wrong password");
  }

  const isNewPasswordUsed = await Promise.all(
    this.passwordHistory.map(async (oldPasswordHash) => {
      return await bcrypt.compare(newPassword, oldPasswordHash);
    })
  );

  if (isNewPasswordUsed.includes(true)) {
    throw new Error("password already used!");
  }

  this.passwordHistory.push(this.password);
  this.password = await bcrypt.hash(newPassword, 10);
  await this.save();
};
/* *********************reset password end************ */
module.exports = { isPasswordValid,resetPassword};
