const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const { jwtSecret } = require("../config");

const authenticationMiddleware = (allowedRoles) => (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      status: "fail",
      msg: "Unauthorized: No token provided",
    });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: "fail",
        msg: "Unauthorized: Invalid token",
      });
    }

    if (allowedRoles.includes(decoded.user.role)) {
      req.authUser = decoded.user;
      next();
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({
        status: "fail",
        msg: "Unauthorized: Invalid role",
      });
    }
  });
};

module.exports = authenticationMiddleware;
