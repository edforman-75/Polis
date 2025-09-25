const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    // For development, allow bypassing auth with a special header
    if (process.env.NODE_ENV === 'development' && req.headers['x-dev-user']) {
        req.user = {
            id: 1,
            email: 'dev@campaign.com',
            name: 'Dev User',
            role: 'admin'
        };
        return next();
    }

    // Check for session
    if (req.session && req.session.userId) {
        req.user = {
            id: req.session.userId,
            email: req.session.email,
            name: req.session.name,
            role: req.session.role
        };
        return next();
    }

    // Check for JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    res.status(401).json({ error: 'Authentication required' });
};

// Middleware to check role permissions
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Helper to hash passwords
const hashPassword = async (password) => {
    return bcrypt.hash(password, 10);
};

// Helper to verify passwords
const verifyPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

// Helper to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '7d' }
    );
};

module.exports = {
    requireAuth,
    requireRole,
    hashPassword,
    verifyPassword,
    generateToken
};