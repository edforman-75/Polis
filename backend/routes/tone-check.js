const express = require('express');
const router = express.Router();
const toneAnalyzer = require('../services/tone-analyzer');

/**
 * Real-time tone analysis against campaign profile
 * Used by editor for interactive feedback
 */
router.post('/tone-check', async (req, res) => {
    try {
        const {
            content,
            contentType = 'press_release',
            context = 'default'
        } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Content is required'
            });
        }

        // Run campaign profile analysis
        const analysis = await toneAnalyzer.analyzeAgainstCampaignProfile(
            content,
            contentType,
            context
        );

        res.json({
            success: true,
            analysis: analysis
        });

    } catch (error) {
        console.error('Tone check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Tone analysis failed',
            details: error.message
        });
    }
});

/**
 * Get tone check options (content types and contexts)
 */
router.get('/tone-check/options', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');

        const settingsPath = path.join(__dirname, '../config/tone-settings.json');
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

        const options = {
            contentTypes: [],
            contexts: {},
            activeProfile: settings.campaignTone.useProfile || 'default',
            profileEnabled: settings.campaignTone.enabled
        };

        // Get available content types
        if (settings.campaignTone.contentTypes) {
            options.contentTypes = Object.keys(settings.campaignTone.contentTypes);

            // Get contexts for each content type
            Object.entries(settings.campaignTone.contentTypes).forEach(([type, contexts]) => {
                options.contexts[type] = Object.keys(contexts);
            });
        }

        res.json({
            success: true,
            options: options
        });

    } catch (error) {
        console.error('Failed to load tone check options:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load options',
            details: error.message
        });
    }
});

module.exports = router;
