/**
 * Text Analysis API Routes
 * Analyzes body text for quality issues including run-on sentences
 */

const express = require('express');
const router = express.Router();
const TextQualityAnalyzer = require('../utils/text-quality-analyzer');
const ReadabilityAnalyzer = require('../utils/readability-analyzer');
const PressReleaseParser = require('../utils/press-release-parser');

const textAnalyzer = new TextQualityAnalyzer();
const readabilityAnalyzer = new ReadabilityAnalyzer();
const pressReleaseParser = new PressReleaseParser();

/**
 * Analyze full text
 * POST /api/text-analysis/analyze
 */
router.post('/analyze', (req, res) => {
    try {
        const { text, options } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const analysis = textAnalyzer.analyzeText(text, options || {});

        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error('Error analyzing text:', error);
        res.status(500).json({ error: 'Failed to analyze text', details: error.message });
    }
});

/**
 * Analyze specific paragraph
 * POST /api/text-analysis/analyze-paragraph
 */
router.post('/analyze-paragraph', (req, res) => {
    try {
        const { text, paragraphNumber } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const issues = textAnalyzer.analyzeParagraph(text, paragraphNumber || 1);

        res.json({
            success: true,
            issues,
            count: issues.length
        });
    } catch (error) {
        console.error('Error analyzing paragraph:', error);
        res.status(500).json({ error: 'Failed to analyze paragraph', details: error.message });
    }
});

/**
 * Check for run-on sentences only
 * POST /api/text-analysis/check-runons
 */
router.post('/check-runons', (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Use the existing PressReleaseParser to extract structure
        const structure = pressReleaseParser.extractContentStructure(text);

        // Get all body paragraphs (lead + body paragraphs)
        const bodyParagraphs = [structure.lead_paragraph, ...structure.body_paragraphs]
            .filter(p => p.trim().length > 0);

        // Process each paragraph separately - run-ons can only occur within a single paragraph
        const runOnSentences = [];
        let totalSentenceCount = 0;

        bodyParagraphs.forEach((paragraph, paragraphIdx) => {
            // Split this paragraph into sentences
            const sentences = textAnalyzer.splitIntoSentences(paragraph);

            sentences.forEach((sentence, sentenceIdx) => {
                totalSentenceCount++;
                const check = textAnalyzer.checkRunOnSentence(sentence);

                if (check.isRunOn) {
                    runOnSentences.push({
                        sentenceNumber: totalSentenceCount,
                        paragraphNumber: paragraphIdx + 1,
                        sentence: sentence.trim(),
                        wordCount: check.wordCount,
                        conjunctions: check.conjunctions,
                        clauses: check.clauses,
                        details: check.details
                    });
                }
            });
        });

        res.json({
            success: true,
            totalSentences: totalSentenceCount,
            runOnCount: runOnSentences.length,
            runOnSentences
        });
    } catch (error) {
        console.error('Error checking run-ons:', error);
        res.status(500).json({ error: 'Failed to check run-ons', details: error.message });
    }
});

/**
 * Get text statistics
 * POST /api/text-analysis/statistics
 */
router.post('/statistics', (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const statistics = textAnalyzer.calculateStatistics(text);

        res.json({
            success: true,
            statistics
        });
    } catch (error) {
        console.error('Error calculating statistics:', error);
        res.status(500).json({ error: 'Failed to calculate statistics', details: error.message });
    }
});

/**
 * Analyze readability with grade level
 * POST /api/text-analysis/readability
 */
router.post('/readability', (req, res) => {
    try {
        const { text, targetGrade, contentType } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const analysis = readabilityAnalyzer.analyzeReadability(
            text,
            targetGrade || 8,
            contentType || 'press_release'
        );

        const report = readabilityAnalyzer.formatReport(analysis);

        res.json({
            success: true,
            readability: report
        });
    } catch (error) {
        console.error('Error analyzing readability:', error);
        res.status(500).json({ error: 'Failed to analyze readability', details: error.message });
    }
});

/**
 * Get recommended grade levels for content types
 * GET /api/text-analysis/recommended-levels
 */
router.get('/recommended-levels', (req, res) => {
    try {
        res.json({
            success: true,
            recommendedLevels: readabilityAnalyzer.recommendedLevels,
            tolerance: readabilityAnalyzer.tolerance
        });
    } catch (error) {
        console.error('Error getting recommended levels:', error);
        res.status(500).json({ error: 'Failed to get recommended levels', details: error.message });
    }
});

/**
 * Get current settings (all or for specific content type)
 * GET /api/text-analysis/readability-settings?contentType=press_release
 */
router.get('/readability-settings', (req, res) => {
    try {
        const { contentType } = req.query;
        const settings = readabilityAnalyzer.getSettings(contentType || null);

        res.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error getting readability settings:', error);
        res.status(500).json({ error: 'Failed to get readability settings', details: error.message });
    }
});

/**
 * Update readability settings for a content type
 * POST /api/text-analysis/readability-settings
 * Body: { contentType: 'press_release', settings: { target: 7, range: [6, 9], note: 'Custom note' } }
 */
router.post('/readability-settings', (req, res) => {
    try {
        const { contentType, settings } = req.body;

        if (!contentType) {
            return res.status(400).json({ error: 'contentType is required' });
        }

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'settings object is required' });
        }

        // Update in-memory settings
        readabilityAnalyzer.updateSettings(contentType, settings);

        res.json({
            success: true,
            message: `Settings updated for ${contentType}`,
            updatedSettings: readabilityAnalyzer.getSettings(contentType)
        });
    } catch (error) {
        console.error('Error updating readability settings:', error);
        res.status(500).json({ error: 'Failed to update readability settings', details: error.message });
    }
});

/**
 * Save current settings to config file
 * POST /api/text-analysis/save-readability-settings
 * Body: { campaignSettings: { enabled: true, contentTypes: {...} } }
 */
router.post('/save-readability-settings', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');

        const configPath = path.join(__dirname, '../config/readability-settings.json');

        // Read current config
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        // Update campaign settings
        if (req.body.campaignSettings) {
            config.campaignSettings = {
                ...config.campaignSettings,
                ...req.body.campaignSettings
            };
        }

        // Write back to file
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        res.json({
            success: true,
            message: 'Readability settings saved to config file',
            savedSettings: config.campaignSettings
        });
    } catch (error) {
        console.error('Error saving readability settings:', error);
        res.status(500).json({ error: 'Failed to save readability settings', details: error.message });
    }
});

module.exports = router;
