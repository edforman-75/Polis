/**
 * Text Analysis API Routes
 * Analyzes body text for quality issues including run-on sentences
 */

const express = require('express');
const router = express.Router();
const TextQualityAnalyzer = require('../utils/text-quality-analyzer');
const ReadabilityAnalyzer = require('../utils/readability-analyzer');

const textAnalyzer = new TextQualityAnalyzer();
const readabilityAnalyzer = new ReadabilityAnalyzer();

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

        const sentences = textAnalyzer.splitIntoSentences(text);
        const runOnSentences = [];

        sentences.forEach((sentence, idx) => {
            const check = textAnalyzer.checkRunOnSentence(sentence);
            if (check.isRunOn) {
                runOnSentences.push({
                    sentenceNumber: idx + 1,
                    sentence: sentence,
                    wordCount: check.wordCount,
                    conjunctions: check.conjunctions,
                    clauses: check.clauses,
                    details: check.details
                });
            }
        });

        res.json({
            success: true,
            totalSentences: sentences.length,
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
            recommendedLevels: readabilityAnalyzer.recommendedLevels
        });
    } catch (error) {
        console.error('Error getting recommended levels:', error);
        res.status(500).json({ error: 'Failed to get recommended levels', details: error.message });
    }
});

module.exports = router;
