const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    let token;
    
    if (req?.headers?.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      
      try {
        if (!token) {
          return res.status(401).json({
            "status": "Bad request",
            "message": "Authentication failed",
            "statusCode": 401
        });
      }
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach decoded user information to request object
        req.user = decoded;
        
        next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ message: "Token expired, please log in again" });
        } else {
          return res.status(401).json({ message: "Not Authorized, token invalid" });
        }
      }
    } else {
      return res.status(401).json({
        "status": "Bad request",
        "message": "Authentication failed",
        "statusCode": 401 });
    }
  };
  
  
  module.exports = authMiddleware
  