/**
 * Undo/Redo API Routes
 * Provides endpoints for granular undo/redo functionality with operational transforms
 */

const express = require('express');
const router = express.Router();
const undoRedoManager = require('../services/undo-redo-manager');

// Record an operation for undo/redo tracking
router.post('/record-operation', async (req, res) => {
    try {
        const { sessionId, operationData } = req.body;

        if (!sessionId || !operationData) {
            return res.status(400).json({
                error: 'Session ID and operation data are required'
            });
        }

        const result = await undoRedoManager.recordOperation(sessionId, operationData);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Record Operation Error:', error);
        res.status(500).json({
            error: 'Failed to record operation',
            details: error.message
        });
    }
});

// Perform undo operation(s)
router.post('/undo', async (req, res) => {
    try {
        const { sessionId, operationCount = 1 } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        const result = await undoRedoManager.undo(sessionId, operationCount);

        res.json(result);

    } catch (error) {
        console.error('Undo Error:', error);
        res.status(500).json({
            error: 'Failed to perform undo',
            details: error.message
        });
    }
});

// Perform redo operation(s)
router.post('/redo', async (req, res) => {
    try {
        const { sessionId, operationCount = 1 } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        const result = await undoRedoManager.redo(sessionId, operationCount);

        res.json(result);

    } catch (error) {
        console.error('Redo Error:', error);
        res.status(500).json({
            error: 'Failed to perform redo',
            details: error.message
        });
    }
});

// Get current session status (can undo/redo, operation counts, etc.)
router.get('/session-status/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        const status = await undoRedoManager.getSessionStatus(sessionId);

        res.json(status);

    } catch (error) {
        console.error('Session Status Error:', error);
        res.status(500).json({
            error: 'Failed to get session status',
            details: error.message
        });
    }
});

// Get operations that can be undone (for preview/debugging)
router.get('/undo-operations/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        const operations = await undoRedoManager.getUndoOperations(sessionId, limit);

        res.json({
            operations,
            count: operations.length
        });

    } catch (error) {
        console.error('Get Undo Operations Error:', error);
        res.status(500).json({
            error: 'Failed to get undo operations',
            details: error.message
        });
    }
});

// Get operations that can be redone (for preview/debugging)
router.get('/redo-operations/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        if (!sessionId) {
            return res.status(400).json({
                error: 'Session ID is required'
            });
        }

        const operations = await undoRedoManager.getRedoOperations(sessionId, limit);

        res.json({
            operations,
            count: operations.length
        });

    } catch (error) {
        console.error('Get Redo Operations Error:', error);
        res.status(500).json({
            error: 'Failed to get redo operations',
            details: error.message
        });
    }
});

// Create manual checkpoint
router.post('/create-checkpoint', async (req, res) => {
    try {
        const { sessionId, assignmentId, contentType, contentId, userId } = req.body;

        if (!sessionId || !assignmentId || !contentType || !contentId || !userId) {
            return res.status(400).json({
                error: 'Session ID, assignment ID, content type, content ID, and user ID are required'
            });
        }

        await undoRedoManager.createCheckpoint(sessionId, assignmentId, contentType, contentId, userId);

        res.json({
            success: true,
            message: 'Checkpoint created successfully'
        });

    } catch (error) {
        console.error('Create Checkpoint Error:', error);
        res.status(500).json({
            error: 'Failed to create checkpoint',
            details: error.message
        });
    }
});

// Resolve collaborative editing conflicts
router.post('/resolve-conflict', async (req, res) => {
    try {
        const { sessionId, conflictingOps } = req.body;

        if (!sessionId || !conflictingOps || !Array.isArray(conflictingOps)) {
            return res.status(400).json({
                error: 'Session ID and array of conflicting operations are required'
            });
        }

        const resolvedOps = await undoRedoManager.resolveConflict(sessionId, conflictingOps);

        res.json({
            success: true,
            resolvedOperations: resolvedOps
        });

    } catch (error) {
        console.error('Resolve Conflict Error:', error);
        res.status(500).json({
            error: 'Failed to resolve conflicts',
            details: error.message
        });
    }
});

module.exports = router;