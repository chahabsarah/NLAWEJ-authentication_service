const bcrypt = require('bcryptjs');
const { isPasswordValid, resetPassword } = require('../utils/VerifyPassword');

describe('VerifyPassword utils', () => {
  const mockUser = {
    password: bcrypt.hashSync('current123', 10),
    passwordHistory: [],
    save: jest.fn(),
    isPasswordValid: function (password) {
      return bcrypt.compare(password, this.password);
    }
  };

  it('should validate correct password', async () => {
    const result = await isPasswordValid.call(mockUser, 'current123');
    expect(result).toBe(true);
  });

  it('should reset password if current is valid and not reused', async () => {
    await resetPassword.call(mockUser, 'current123', 'newPassword123');
    expect(mockUser.password).not.toBe('current123');
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should throw error if current password is wrong', async () => {
    await expect(resetPassword.call(mockUser, 'wrongPass', 'newPassword123'))
      .rejects.toThrow('wrong password');
  });
});
