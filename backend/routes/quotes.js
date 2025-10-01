/**
 * Quote Management API Routes
 * Handles quote extraction, quality analysis, and tracking
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const QuoteExtractor = require('../utils/quote-extractor');
const QuoteQualityAnalyzer = require('../utils/quote-quality-analyzer');

// Get database instance
const db = require('../database/init');

// Initialize utilities
const quoteExtractor = new QuoteExtractor();
const quoteAnalyzer = new QuoteQualityAnalyzer();

/**
 * Extract quotes from text
 * POST /api/quotes/extract
 */
router.post('/extract', async (req, res) => {
    try {
        const { text, candidateName, assignmentId } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Extract quotes
        const quotes = quoteExtractor.extractQuotes(text);

        // Get previous candidate quotes for style comparison
        let previousCandidateQuotes = [];
        if (candidateName) {
            previousCandidateQuotes = await db.all(`
                SELECT quote_text
                FROM extracted_quotes
                WHERE speaker_name = ? AND speaker_role = 'candidate'
                ORDER BY created_at DESC
                LIMIT 20
            `, [candidateName]);
        }

        // Analyze each quote
        const quotesWithAnalysis = quotes.map(quote => {
            // Determine if this quote is from the candidate
            const isCandidateQuote = candidateName &&
                quote.speaker_name &&
                quote.speaker_name.toLowerCase().includes(candidateName.toLowerCase());

            const context = {
                speakerRole: isCandidateQuote ? 'candidate' : quote.speaker_role,
                candidateName: candidateName,
                assignmentId: assignmentId
            };

            // Include previous quotes for candidate style comparison
            if (isCandidateQuote && previousCandidateQuotes.length > 0) {
                context.previousCandidateQuotes = previousCandidateQuotes;
                quote.speaker_role = 'candidate';
            }

            const analysis = quoteAnalyzer.analyzeQuote(quote.quote_text, context);

            return {
                ...quote,
                risk_level: analysis.riskLevel,
                flags: analysis.flags,
                recommendations: analysis.recommendations,
                enhanced_quality_score: analysis.baseQualityScore
            };
        });

        res.json({
            success: true,
            quotes: quotesWithAnalysis,
            count: quotesWithAnalysis.length,
            fields: quoteExtractor.parseQuotesToFields(quotesWithAnalysis),
            ldJSON: quoteExtractor.generateAllQuotesLDJSON(quotesWithAnalysis)
        });
    } catch (error) {
        console.error('Error extracting quotes:', error);
        res.status(500).json({ error: 'Failed to extract quotes', details: error.message });
    }
});

/**
 * Analyze a single quote
 * POST /api/quotes/analyze
 */
router.post('/analyze', (req, res) => {
    try {
        const { quoteText, context } = req.body;

        if (!quoteText) {
            return res.status(400).json({ error: 'Quote text is required' });
        }

        // If this is a candidate quote, fetch previous candidate quotes for style comparison
        if (context && context.speakerRole === 'candidate' && context.candidateName) {
            const previousQuotes = db.prepare(`
                SELECT quote_text
                FROM extracted_quotes
                WHERE speaker_name = ? AND speaker_role = 'candidate'
                ORDER BY created_at DESC
                LIMIT 20
            `).all(context.candidateName);

            if (previousQuotes.length > 0) {
                context.previousCandidateQuotes = previousQuotes;
            }
        }

        const analysis = quoteAnalyzer.analyzeQuote(quoteText, context || {});

        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error('Error analyzing quote:', error);
        res.status(500).json({ error: 'Failed to analyze quote', details: error.message });
    }
});

/**
 * Save extracted quotes to database
 * POST /api/quotes/save
 */
router.post('/save', (req, res) => {
    try {
        const { assignmentId, quotes } = req.body;

        if (!assignmentId || !quotes || !Array.isArray(quotes)) {
            return res.status(400).json({ error: 'Assignment ID and quotes array required' });
        }

        const insertStmt = db.prepare(`
            INSERT INTO extracted_quotes (
                assignment_id, quote_text, quote_number, speaker_name, speaker_title, speaker_role,
                position_in_text, quality_score, quality_issues, needs_review,
                is_protected, extraction_pattern, extraction_confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertIssueStmt = db.prepare(`
            INSERT INTO quote_quality_issues (
                quote_id, issue_type, issue_severity, issue_message, issue_details, auto_detected
            ) VALUES (?, ?, ?, ?, ?, 1)
        `);

        const savedQuotes = [];

        db.transaction(() => {
            quotes.forEach(quote => {
                const result = insertStmt.run(
                    assignmentId,
                    quote.quote_text,
                    quote.quote_number,
                    quote.speaker_name,
                    quote.speaker_title,
                    quote.speaker_role || null,
                    quote.position || null,
                    quote.quality_score || 100,
                    JSON.stringify(quote.quality_issues || []),
                    quote.needs_review ? 1 : 0,
                    quote.is_protected !== false ? 1 : 0,
                    quote.pattern_type || null,
                    quote.extraction_confidence || 1.0
                );

                const quoteId = result.lastInsertRowid;

                // Insert individual quality issues
                if (quote.quality_issues && Array.isArray(quote.quality_issues)) {
                    quote.quality_issues.forEach(issue => {
                        insertIssueStmt.run(
                            quoteId,
                            issue.type,
                            issue.severity,
                            issue.message,
                            issue.details || null
                        );
                    });
                }

                savedQuotes.push({ id: quoteId, ...quote });
            });
        })();

        res.json({
            success: true,
            savedQuotes,
            count: savedQuotes.length
        });
    } catch (error) {
        console.error('Error saving quotes:', error);
        res.status(500).json({ error: 'Failed to save quotes', details: error.message });
    }
});

/**
 * Get quotes for an assignment
 * GET /api/quotes/assignment/:assignmentId
 */
router.get('/assignment/:assignmentId', (req, res) => {
    try {
        const { assignmentId } = req.params;

        const quotes = db.prepare(`
            SELECT *
            FROM extracted_quotes
            WHERE assignment_id = ?
            ORDER BY quote_number ASC
        `).all(assignmentId);

        // Parse JSON fields
        quotes.forEach(quote => {
            if (quote.quality_issues) {
                quote.quality_issues = JSON.parse(quote.quality_issues);
            }
        });

        // Get quality issues for each quote
        quotes.forEach(quote => {
            const issues = db.prepare(`
                SELECT issue_type, issue_severity, issue_message, issue_details
                FROM quote_quality_issues
                WHERE quote_id = ?
            `).all(quote.id);
            quote.quality_issues_detailed = issues;
        });

        res.json({
            success: true,
            quotes,
            count: quotes.length
        });
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ error: 'Failed to fetch quotes', details: error.message });
    }
});

/**
 * Record quote modification warning
 * POST /api/quotes/warn
 */
router.post('/warn', (req, res) => {
    try {
        const {
            quoteId,
            assignmentId,
            warningType,
            originalText,
            attemptedChange,
            editorUser
        } = req.body;

        if (!quoteId || !originalText || !attemptedChange) {
            return res.status(400).json({
                error: 'Quote ID, original text, and attempted change are required'
            });
        }

        // Calculate severity based on change magnitude
        const similarity = calculateSimilarity(originalText, attemptedChange);
        let severity = 'high'; // Default for quote modifications

        if (similarity >= 0.95) {
            severity = 'low'; // Minor typo fixes
        } else if (similarity >= 0.85) {
            severity = 'medium';
        }

        const result = db.prepare(`
            INSERT INTO quote_modification_warnings (
                quote_id, assignment_id, warning_type, warning_severity,
                original_text, attempted_change, editor_user
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            quoteId,
            assignmentId || null,
            warningType,
            severity,
            originalText,
            attemptedChange,
            editorUser || null
        );

        res.json({
            success: true,
            warningId: result.lastInsertRowid,
            severity,
            similarity
        });
    } catch (error) {
        console.error('Error creating quote warning:', error);
        res.status(500).json({ error: 'Failed to create warning', details: error.message });
    }
});

/**
 * Acknowledge a quote modification warning
 * POST /api/quotes/acknowledge-warning/:warningId
 */
router.post('/acknowledge-warning/:warningId', (req, res) => {
    try {
        const { warningId } = req.params;
        const { acknowledgmentNotes } = req.body;

        const result = db.prepare(`
            UPDATE quote_modification_warnings
            SET editor_acknowledged = 1,
                acknowledged_at = CURRENT_TIMESTAMP,
                acknowledgment_notes = ?
            WHERE id = ?
        `).run(acknowledgmentNotes || null, warningId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Warning not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error acknowledging warning:', error);
        res.status(500).json({ error: 'Failed to acknowledge warning', details: error.message });
    }
});

/**
 * Get quotes that need review
 * GET /api/quotes/needs-review
 */
router.get('/needs-review', (req, res) => {
    try {
        const { limit = 50, assignmentId } = req.query;

        let query = `
            SELECT eq.*, a.title as assignment_title
            FROM extracted_quotes eq
            LEFT JOIN assignments a ON eq.assignment_id = a.id
            WHERE eq.needs_review = 1
        `;

        const params = [];
        if (assignmentId) {
            query += ` AND eq.assignment_id = ?`;
            params.push(assignmentId);
        }

        query += ` ORDER BY eq.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const quotes = db.prepare(query).all(...params);

        // Parse JSON fields
        quotes.forEach(quote => {
            if (quote.quality_issues) {
                quote.quality_issues = JSON.parse(quote.quality_issues);
            }
        });

        res.json({
            success: true,
            quotes,
            count: quotes.length
        });
    } catch (error) {
        console.error('Error fetching quotes needing review:', error);
        res.status(500).json({ error: 'Failed to fetch quotes', details: error.message });
    }
});

/**
 * Update quote review status
 * POST /api/quotes/:quoteId/review
 */
router.post('/:quoteId/review', (req, res) => {
    try {
        const { quoteId } = req.params;
        const { needsReview, reviewNotes } = req.body;

        const result = db.prepare(`
            UPDATE extracted_quotes
            SET needs_review = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(needsReview ? 1 : 0, quoteId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating review status:', error);
        res.status(500).json({ error: 'Failed to update review status', details: error.message });
    }
});

/**
 * Get modification warnings for an assignment
 * GET /api/quotes/warnings/:assignmentId
 */
router.get('/warnings/:assignmentId', (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { acknowledged } = req.query;

        let query = `
            SELECT qmw.*, eq.quote_text, eq.speaker_name
            FROM quote_modification_warnings qmw
            LEFT JOIN extracted_quotes eq ON qmw.quote_id = eq.id
            WHERE qmw.assignment_id = ?
        `;

        const params = [assignmentId];

        if (acknowledged !== undefined) {
            query += ` AND qmw.editor_acknowledged = ?`;
            params.push(acknowledged === 'true' ? 1 : 0);
        }

        query += ` ORDER BY qmw.created_at DESC`;

        const warnings = db.prepare(query).all(...params);

        res.json({
            success: true,
            warnings,
            count: warnings.length
        });
    } catch (error) {
        console.error('Error fetching warnings:', error);
        res.status(500).json({ error: 'Failed to fetch warnings', details: error.message });
    }
});

/**
 * Helper function to calculate text similarity
 */
function calculateSimilarity(text1, text2) {
    const normalize = (t) => t.trim().toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const a = normalize(text1);
    const b = normalize(text2);

    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;

    const distance = levenshteinDistance(a, b);
    return 1.0 - (distance / maxLen);
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

module.exports = router;
