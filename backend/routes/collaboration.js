const express = require('express');
const router = express.Router();
const collaborationManager = require('../collaboration/manager');
const { requireAuth, requirePermission } = require('../middleware/authorization');

// Get collaboration session info for an assignment
router.get('/session/:assignmentId', requireAuth, async (req, res) => {
    try {
        const { assignmentId } = req.params;

        // Check if user has access to this assignment
        const hasAccess = await checkAssignmentAccess(req.user.id, req.user.role, assignmentId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied to assignment' });
        }

        const sessionInfo = collaborationManager.getSessionInfo(assignmentId);

        if (!sessionInfo) {
            return res.json({
                assignmentId,
                activeUsers: [],
                documentVersion: 0,
                lastModified: null,
                status: 'not_active'
            });
        }

        res.json(sessionInfo);
    } catch (error) {
        console.error('Error getting collaboration session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all active collaboration sessions (for admins)
router.get('/sessions', requireAuth, requirePermission('admin'), async (req, res) => {
    try {
        const allSessions = [];

        for (const [assignmentId, session] of collaborationManager.sessions.entries()) {
            allSessions.push({
                assignmentId,
                activeUsers: Array.from(session.activeUsers.values()),
                documentVersion: session.document.version,
                lastModified: session.document.lastModified,
                status: session.document.status
            });
        }

        res.json({ sessions: allSessions });
    } catch (error) {
        console.error('Error getting all sessions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Force disconnect a user from a session (for emergencies)
router.post('/session/:assignmentId/disconnect/:userId', requireAuth, requirePermission('communications_director'), async (req, res) => {
    try {
        const { assignmentId, userId } = req.params;

        // Find user connection and disconnect
        const connection = collaborationManager.userConnections.get(parseInt(userId));
        if (connection && connection.assignmentId === assignmentId) {
            connection.ws.close();
            res.json({ message: 'User disconnected successfully' });
        } else {
            res.status(404).json({ error: 'User not found in session' });
        }
    } catch (error) {
        console.error('Error disconnecting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Emergency lock/unlock a document for collaboration
router.post('/session/:assignmentId/lock', requireAuth, requirePermission('communications_director'), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { action } = req.body; // 'lock' or 'unlock'

        const session = collaborationManager.sessions.get(assignmentId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const newStatus = action === 'lock' ? 'locked' : 'draft';
        session.document.status = newStatus;
        session.document.lastModified = new Date();
        session.document.lastModifiedBy = req.user.id;

        // Broadcast status change to all users in session
        collaborationManager.broadcastToSession(assignmentId, {
            type: 'document_locked',
            locked: action === 'lock',
            status: newStatus,
            lockedBy: {
                userId: req.user.id,
                userName: req.user.name,
                role: req.user.role
            },
            timestamp: new Date()
        });

        res.json({
            message: `Document ${action}ed successfully`,
            status: newStatus
        });
    } catch (error) {
        console.error('Error locking/unlocking document:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get collaboration statistics
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const stats = {
            activeSessions: collaborationManager.sessions.size,
            totalConnectedUsers: collaborationManager.userConnections.size,
            sessionDetails: []
        };

        for (const [assignmentId, session] of collaborationManager.sessions.entries()) {
            stats.sessionDetails.push({
                assignmentId,
                activeUserCount: session.activeUsers.size,
                documentVersion: session.document.version,
                lastActivity: session.document.lastModified
            });
        }

        res.json(stats);
    } catch (error) {
        console.error('Error getting collaboration stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Utility function to check assignment access
async function checkAssignmentAccess(userId, role, assignmentId) {
    // Simplified access check - in production would check database
    // Allow access to most editorial roles
    const allowedRoles = [
        'senior_writer',
        'press_secretary',
        'communications_director',
        'campaign_manager',
        'admin'
    ];

    return allowedRoles.includes(role);
}

module.exports = router;