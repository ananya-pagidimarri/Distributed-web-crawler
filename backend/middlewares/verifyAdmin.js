const verifyAdmin = (req, res, next) => {
  // Ensure req.user exists (meaning verifyToken has already run)
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Access denied. User not authenticated.' });
  }

  // Check role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }

  next();
};

module.exports = verifyAdmin;
