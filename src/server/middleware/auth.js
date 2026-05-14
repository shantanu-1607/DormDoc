const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        req.user = {
          _id: '64d2f8b5e2a2c41234567890',
          name: 'Test Student',
          role: 'student',
          studentId: 'BIT123',
          department: 'Computer Science',
          bloodGroup: 'O+'
        };
        return next();
      }
      return res.status(401).json({ message: 'Access token required' });
    }

    // Dev bypass for regular student testing
    if (process.env.NODE_ENV === 'development' && token === 'dev_token') {
      req.user = {
        _id: '64d2f8b5e2a2c41234567890',
        name: 'Test Student',
        role: 'student',
        studentId: 'BIT123',
        department: 'Computer Science',
        bloodGroup: 'O+'
      };
      return next();
    }

    // Dev bypass for HOD testing
    if (process.env.NODE_ENV === 'development' && token === 'hod_dev_token') {
      req.user = {
        _id: '64d2f8b5e2a2c41234567892',
        name: 'Test HOD',
        role: 'hod',
        facultyId: 'BIT-FAC-HOD-001',
        department: 'Computer Science',
        hodDepartment: 'Computer Science',
        designation: 'HOD',
        hodPermissions: {
          canApproveLeave: true,
          canViewMedicalHistory: true,
          canExportReports: true,
        },
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Primary lookup: User collection (students, admins, doctors via legacy auth)
    let user = await User.findById(decoded.userId).select('-password');

    // Fallback lookup: Faculty collection (HODs, faculty, deans via Clerk auth)
    if (!user) {
      const facultyUser = await Faculty.findById(decoded.userId).select('-__v');
      if (facultyUser) {
        user = facultyUser;
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Check if user has one of the allowed roles (generic role guard)
// Usage: requireRole(['hod']) or requireRole(['hod', 'admin'])
const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access restricted to: ${roles.join(', ')}`,
    });
  }
  next();
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Check if user is student
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
};

// Optional authentication (for public routes that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This would be implemented with a more sophisticated rate limiting system
  // For now, we'll rely on the general rate limiter
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireStudent,
  optionalAuth,
  sensitiveOperationLimit
};
