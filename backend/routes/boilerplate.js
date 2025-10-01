/**
 * Boilerplate Management Routes
 */

const express = require('express');
const router = express.Router();
const BoilerplateManager = require('../data/boilerplate-manager');
const BoilerplateDetector = require('../utils/boilerplate-detector');
const db = require('../database/init');

const boilerplateManager = new BoilerplateManager(db);
const boilerplateDetector = new BoilerplateDetector();

/**
 * Detect boilerplate in press release text
 * POST /api/boilerplate/detect
 */
router.post('/detect', async (req, res) => {
    try {
        const { text, candidateName } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const detected = boilerplateDetector.detectBoilerplate(text, candidateName);
        const primary = boilerplateDetector.extractPrimaryBoilerplate(text, candidateName);

        res.json({
            detected,
            primary,
            count: detected.length
        });
    } catch (error) {
        console.error('Error detecting boilerplate:', error);
        res.status(500).json({ error: 'Failed to detect boilerplate' });
    }
});

/**
 * Check if text is boilerplate
 * POST /api/boilerplate/check
 */
router.post('/check', async (req, res) => {
    try {
        const { text, candidateName } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = boilerplateDetector.isBoilerplateParagraph(text, candidateName);

        // Also check against known boilerplate in database
        if (candidateName) {
            const match = await boilerplateManager.findMatchingBoilerplate(candidateName, text, 0.85);
            if (match) {
                result.matchedKnownBoilerplate = true;
                result.matchedBoilerplateId = match.match.id;
                result.similarity = match.similarity;
                result.isExact = match.isExact;
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Error checking boilerplate:', error);
        res.status(500).json({ error: 'Failed to check boilerplate' });
    }
});

/**
 * Add boilerplate to library
 * POST /api/boilerplate/add
 */
router.post('/add', async (req, res) => {
    try {
        const { candidateName, text, metadata } = req.body;

        if (!candidateName || !text) {
            return res.status(400).json({ error: 'Candidate name and text are required' });
        }

        const result = await boilerplateManager.addBoilerplate(candidateName, text, metadata);

        res.json({
            success: true,
            boilerplateId: result.id,
            isNew: result.isNew
        });
    } catch (error) {
        console.error('Error adding boilerplate:', error);
        res.status(500).json({ error: 'Failed to add boilerplate' });
    }
});

/**
 * Get all boilerplates for a candidate
 * GET /api/boilerplate/candidate/:candidateName
 */
router.get('/candidate/:candidateName', async (req, res) => {
    try {
        const { candidateName } = req.params;

        const boilerplates = await boilerplateManager.getBoilerplatesForCandidate(candidateName);

        res.json({
            candidateName,
            boilerplates,
            count: boilerplates.length
        });
    } catch (error) {
        console.error('Error getting boilerplates:', error);
        res.status(500).json({ error: 'Failed to get boilerplates' });
    }
});

/**
 * Record boilerplate usage
 * POST /api/boilerplate/record-usage
 */
router.post('/record-usage', async (req, res) => {
    try {
        const { boilerplateId, assignmentId, originalText, modifiedText } = req.body;

        if (!boilerplateId) {
            return res.status(400).json({ error: 'Boilerplate ID is required' });
        }

        const usage = await boilerplateManager.recordUsage(
            boilerplateId,
            assignmentId,
            originalText,
            modifiedText
        );

        res.json({
            success: true,
            usageId: usage.id,
            wasModified: usage.wasModified,
            modificationType: usage.modificationType,
            similarity: usage.similarity
        });
    } catch (error) {
        console.error('Error recording usage:', error);
        res.status(500).json({ error: 'Failed to record usage' });
    }
});

/**
 * Create modification warning
 * POST /api/boilerplate/warn
 */
router.post('/warn', async (req, res) => {
    try {
        const {
            assignmentId,
            boilerplateId,
            warningType,
            originalText,
            attemptedChange,
            editorUser
        } = req.body;

        if (!assignmentId || !boilerplateId || !warningType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const warning = await boilerplateManager.createWarning(
            assignmentId,
            boilerplateId,
            warningType,
            originalText,
            attemptedChange,
            editorUser
        );

        res.json({
            success: true,
            warningId: warning.id,
            severity: warning.severity,
            similarity: warning.similarity
        });
    } catch (error) {
        console.error('Error creating warning:', error);
        res.status(500).json({ error: 'Failed to create warning' });
    }
});

/**
 * Get warnings for assignment
 * GET /api/boilerplate/warnings/:assignmentId
 */
router.get('/warnings/:assignmentId', async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const warnings = await boilerplateManager.getWarningsForAssignment(assignmentId);

        res.json({
            assignmentId,
            warnings,
            count: warnings.length
        });
    } catch (error) {
        console.error('Error getting warnings:', error);
        res.status(500).json({ error: 'Failed to get warnings' });
    }
});

/**
 * Acknowledge warning
 * POST /api/boilerplate/acknowledge/:warningId
 */
router.post('/acknowledge/:warningId', async (req, res) => {
    try {
        const { warningId } = req.params;
        const { editorUser } = req.body;

        await boilerplateManager.acknowledgeWarning(warningId, editorUser);

        res.json({ success: true });
    } catch (error) {
        console.error('Error acknowledging warning:', error);
        res.status(500).json({ error: 'Failed to acknowledge warning' });
    }
});

/**
 * Get modification history for candidate
 * GET /api/boilerplate/history/:candidateName
 */
router.get('/history/:candidateName', async (req, res) => {
    try {
        const { candidateName } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const history = await boilerplateManager.getModificationHistory(candidateName, limit);

        res.json({
            candidateName,
            history,
            count: history.length
        });
    } catch (error) {
        console.error('Error getting history:', error);
        res.status(500).json({ error: 'Failed to get modification history' });
    }
});

/**
 * Deactivate boilerplate
 * POST /api/boilerplate/deactivate/:boilerplateId
 */
router.post('/deactivate/:boilerplateId', async (req, res) => {
    try {
        const { boilerplateId } = req.params;

        await boilerplateManager.deactivateBoilerplate(boilerplateId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deactivating boilerplate:', error);
        res.status(500).json({ error: 'Failed to deactivate boilerplate' });
    }
});

module.exports = router;
