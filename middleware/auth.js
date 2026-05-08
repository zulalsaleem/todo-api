const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  // Get token from request header
  // Header format: Authorization: Bearer eyJhbGci...
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // No token provided
  if (!token) {
    return res.status(401).json({
      error: 'Access denied. No token provided.',
      hint: 'Add Authorization: Bearer YOUR_TOKEN to request headers'
    });
  }

  // Verify token is valid and not expired
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token. Please login again.'
      });
    }

    // Token valid — attach user info to request
    req.user = decoded;
    next();
  });
}

module.exports = authenticateToken;