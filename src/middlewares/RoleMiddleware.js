const checkAdminRole = (req, res, next) => {

    if (!req.user || !req.user.role) {
      return res.status(404).json({ message: "user role not found" });
    }
    if (!req.user.role === "admin") {
      return res.status(403).json({ message: "access denied !" });
    }
    next();
  };

module.exports = {checkAdminRole};
