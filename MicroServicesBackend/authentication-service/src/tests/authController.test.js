jest.mock('nodemailer', () => {
  const sendMailMock = jest.fn().mockResolvedValue(true);
  return {
    createTransport: jest.fn(() => ({
      sendMail: sendMailMock,
      verify: jest.fn((cb) => cb(null, true)),
    })),
  };
});

const mockingoose = require('mockingoose');
const bcrypt = require('bcryptjs');
const httpMocks = require('node-mocks-http');

const { registerClients, login } = require('../controllers/AuthController');
const { getAllClients } = require('../controllers/UserManagement');
const User = require('../models/User');

jest.mock('../models/User');

describe('AuthController tests', () => {

  describe('registerClients', () => {
    it('should return 400 if email is missing', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: {
          fullName: "John Doe",
          password: "12345678",
          retypePassword: "12345678",
          cin: "12345678",
          address: "Test Address",
          role: "habitant",
          phone: "555-555"
        },
        files: {}
      });

      const res = httpMocks.createResponse();

      await registerClients(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toHaveProperty('message', 'All fields are required!');
    });
  });

  describe('login', () => {
    it('should return 400 if password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const userMock = {
        email: 'test@example.com',
        password: hashedPassword,
        AccountStatus: 'Active',
        failedAttempts: 0,
        save: jest.fn(),
        isPasswordValid: jest.fn().mockResolvedValue(false),
      };
      User.findOne.mockResolvedValue(userMock);

      const req = httpMocks.createRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });
      const res = httpMocks.createResponse();

      await login(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toHaveProperty('msg', 'Wrong credentials');
    });
  });

});

describe('UserController tests', () => {
  describe('getAllClients', () => {
    it('should return habitants and artisans', async () => {
      const mockUsers = [
        { fullName: 'Client1', role: 'habitant' },
        { fullName: 'Client2', role: 'artisan' }
      ];

      User.find.mockResolvedValue(mockUsers);

      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      await getAllClients(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(mockUsers);
    });
  });
});
const {
  addUser,
  signUpAdmin,
  verifyEmail,
  logout,
  resetPassword,
  resetForgetPassword
} = require('../controllers/AuthController');

jest.mock('../utils/RandomPassword', () => jest.fn(() => 'Random@1234'));
jest.mock('../services/EmailService', () => ({
  sendVerificationCode: jest.fn(),
  updatePasswordAlert: jest.fn(),
  forgotPasswordReset: jest.fn()
}));


describe('Additional AuthController Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addUser', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = httpMocks.createRequest({ method: 'POST', body: {} });
      const res = httpMocks.createResponse();

      await addUser(req, res);
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if phone or email already exists', async () => {
      User.findOne.mockResolvedValueOnce(true); // phone exists
      const req = httpMocks.createRequest({ method: 'POST', body: {
        fullName: 'Test',
        email: 'test@mail.com',
        phone: '12345678',
        address: 'test',
        role: 'habitant',
        cin: '00000000'
      }});
      const res = httpMocks.createResponse();

      await addUser(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('signUpAdmin', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = httpMocks.createRequest({ method: 'POST', body: {} });
      const res = httpMocks.createResponse();
      await signUpAdmin(req, res);
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 if passwords do not match', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: {
          fullName: 'Admin',
          email: 'admin@mail.com',
          phone: '12345678',
          password: 'abc123',
          retypePassword: 'xyz789',
          address: 'admin',
          cin: '11111111'
        }
      });
      const res = httpMocks.createResponse();
      await signUpAdmin(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('verifyEmail', () => {
    it('should return 400 if user does not exist or code is wrong', async () => {
      User.findOne.mockResolvedValue(null);
      const req = httpMocks.createRequest({ body: { email: 'mail@mail.com', code: '123456' }});
      const res = httpMocks.createResponse();

      await verifyEmail(req, res);
      expect(res.statusCode).toBe(400);
    });

    it('should verify user if correct code', async () => {
      const mockUser = {
        verificationCode: '123456',
        isVerified: false,
        save: jest.fn()
      };
      User.findOne.mockResolvedValue(mockUser);
      const req = httpMocks.createRequest({ body: { email: 'mail@mail.com', code: '123456' }});
      const res = httpMocks.createResponse();

      await verifyEmail(req, res);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('logout', () => {
    it('should return 400 if userId is not provided', async () => {
      const req = httpMocks.createRequest({ body: {} });
      const res = httpMocks.createResponse();
      await logout(req, res);
      expect(res.statusCode).toBe(400);
    });

    it('should logout successfully', async () => {
      const mockUser = {
        refreshToken: 'xx',
        refreshTokenExpiration: new Date(),
        save: jest.fn()
      };
      User.findById.mockResolvedValue(mockUser);
      const req = httpMocks.createRequest({ body: { userId: 'user123' }});
      const res = httpMocks.createResponse();

      await logout(req, res);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('resetPassword', () => {
    it('should reset password if valid', async () => {
      const mockUser = {
        email: 'user@mail.com',
        resetPassword: jest.fn(),
        save: jest.fn()
      };
      req = httpMocks.createRequest({
        user: { id: 'userId' },
        body: {
          currentPassword: 'oldPass',
          newPassword: 'newPass'
        }
      });
      res = httpMocks.createResponse();
      User.findById.mockResolvedValue(mockUser);

      await resetPassword(req, res);
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);
      const req = httpMocks.createRequest({ user: { id: 'userId' }, body: {} });
      const res = httpMocks.createResponse();
      await resetPassword(req, res);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('resetForgetPassword', () => {
    it('should return 404 if email not found', async () => {
      User.findOne.mockResolvedValue(null);
      const req = httpMocks.createRequest({ body: { email: 'nonexistent@mail.com' } });
      const res = httpMocks.createResponse();
      await resetForgetPassword(req, res);
      expect(res.statusCode).toBe(404);
    });

    it('should reset forgotten password', async () => {
      const mockUser = {
        save: jest.fn()
      };
      User.findOne.mockResolvedValue(mockUser);
      const req = httpMocks.createRequest({ body: { email: 'user@mail.com' } });
      const res = httpMocks.createResponse();
      await resetForgetPassword(req, res);
      expect(res.statusCode).toBe(200);
    });
  });
});
