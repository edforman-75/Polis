const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { verifyPassword, generateToken } = require('../middleware/auth');
const UserManager = require('../data/user-manager');

// Create manager instance
const userManager = new UserManager(db);

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await userManager.getUserByEmail(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await verifyPassword(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await userManager.updateLastLogin(user.id);

        // Set session
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.name = user.name;
        req.session.role = user.role;

        // Generate token
        const token = generateToken(user);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Get current user
router.get('/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
        id: req.session.userId,
        email: req.session.email,
        name: req.session.name,
        role: req.session.role
    });
});

// Development-only: Quick login for testing
if (process.env.NODE_ENV === 'development') {
    router.post('/dev-login', async (req, res) => {
        const { role = 'writer' } = req.body;

        // Get a user with the specified role
        const user = await userManager.getUserByRole(role);

        if (!user) {
            return res.status(404).json({ error: 'No user found with that role' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.name = user.name;
        req.session.role = user.role;

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            message: 'Dev login successful'
        });
    });
}

module.exports = router;