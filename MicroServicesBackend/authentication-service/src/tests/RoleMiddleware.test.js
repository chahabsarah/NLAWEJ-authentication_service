const { checkAdminRole } = require('../middlewares/RoleMiddleware');

describe('checkAdminRole middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 404 if req.user is missing', () => {
    checkAdminRole(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'user role not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user is not admin', () => {
    req.user = { role: 'habitant' };
    checkAdminRole(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'access denied !' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() if user is admin', () => {
    req.user = { role: 'admin' };
    checkAdminRole(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
