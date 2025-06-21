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
