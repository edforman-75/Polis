const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');
const PressReleaseParser = require('../utils/press-release-parser');
const ComparativeVerifier = require('../utils/comparative-verifier');
const VerificationRouter = require('../utils/verification-router');

// Initialize parser for claim extraction
const parser = new PressReleaseParser();

// Create a new fact-check
router.post('/create', requireAuth, async (req, res) => {
    try {
        const { assignmentId, sourceAssignmentId, content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Generate fact-check ID
        const timestamp = Date.now();
        const factCheckId = `FC-${new Date().getFullYear()}-${String(timestamp).slice(-6)}`;

        // Create fact-check record
        await db.run(`
            INSERT INTO fact_checks (
                id, assignment_id, source_assignment_id, content,
                status, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `, [factCheckId, assignmentId || null, sourceAssignmentId || null, content, 'pending', req.user.id]);

        res.json({
            success: true,
            factCheckId: factCheckId,
            message: 'Fact-check created successfully'
        });

    } catch (error) {
        console.error('Error creating fact-check:', error);
        res.status(500).json({ error: 'Failed to create fact-check' });
    }
});

// Extract claims from fact-check content
router.post('/:id/extract-claims', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Get fact-check
        const factCheck = await db.get('SELECT * FROM fact_checks WHERE id = ?', [id]);
        if (!factCheck) {
            return res.status(404).json({ error: 'Fact-check not found' });
        }

        // Extract claims using the parser
        const claims = parser.extractProvableFacts(factCheck.content);

        // Store extracted claims
        const insertedClaims = [];
        for (let i = 0; i < claims.length; i++) {
            const claim = claims[i];

            // Determine claim type
            let claimType = 'direct_factual';
            let deniabilityScore = 0;
            let hearsayConfidence = 0;
            let privateDataDetected = false;

            if (claim.type.includes('plausible-deniability')) {
                claimType = 'plausible_deniability';
                deniabilityScore = claim.deniability_score || 0;
            } else if (claim.type.includes('hearsay')) {
                claimType = 'hearsay';
                hearsayConfidence = claim.hearsay_confidence || 0;
            } else if (claim.type.includes('private-data')) {
                claimType = 'private_data';
                privateDataDetected = true;
            }

            const result = await db.run(`
                INSERT INTO extracted_claims (
                    fact_check_id, claim_text, claim_type, sentence_index,
                    verifiable, verification_type, confidence_score,
                    patterns_matched, deniability_score, hearsay_confidence,
                    private_data_detected, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                claim.text,
                claimType,
                i,
                claim.verifiable ? 1 : 0,
                claim.verification_type || 'standard',
                claim.confidence || 0.5,
                JSON.stringify(claim.type || []),
                deniabilityScore,
                hearsayConfidence,
                privateDataDetected ? 1 : 0,
                'pending'
            ]);

            insertedClaims.push({
                id: result.lastID,
                ...claim,
                claimType
            });
        }

        // Update fact-check with claim count
        await db.run(`
            UPDATE fact_checks
            SET claims_to_verify = ?, status = 'extracting_claims'
            WHERE id = ?
        `, [JSON.stringify(claims.map(c => c.text)), id]);

        res.json({
            success: true,
            claimsExtracted: insertedClaims.length,
            claims: insertedClaims
        });

    } catch (error) {
        console.error('Error extracting claims:', error);
        res.status(500).json({ error: 'Failed to extract claims' });
    }
});

// Get fact-check details with claims
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Get fact-check
        const factCheck = await db.get(`
            SELECT fc.*,
                   u1.name as created_by_name,
                   u2.name as assigned_to_name,
                   u3.name as completed_by_name
            FROM fact_checks fc
            LEFT JOIN users u1 ON fc.created_by = u1.id
            LEFT JOIN users u2 ON fc.assigned_to = u2.id
            LEFT JOIN users u3 ON fc.completed_by = u3.id
            WHERE fc.id = ?
        `, [id]);

        if (!factCheck) {
            return res.status(404).json({ error: 'Fact-check not found' });
        }

        // Get extracted claims
        const claims = await db.all(`
            SELECT * FROM extracted_claims
            WHERE fact_check_id = ?
            ORDER BY sentence_index
        `, [id]);

        // Get verifications for each claim
        for (let claim of claims) {
            claim.verifications = await db.all(`
                SELECT cv.*, u.name as verified_by_name
                FROM claim_verifications cv
                LEFT JOIN users u ON cv.verified_by = u.id
                WHERE cv.claim_id = ?
                ORDER BY cv.created_at DESC
            `, [claim.id]);

            // Get sources for each verification
            for (let verification of claim.verifications) {
                verification.sources = await db.all(`
                    SELECT * FROM verification_sources
                    WHERE verification_id = ?
                    ORDER BY credibility_score DESC
                `, [verification.id]);
            }
        }

        res.json({
            factCheck,
            claims
        });

    } catch (error) {
        console.error('Error fetching fact-check:', error);
        res.status(500).json({ error: 'Failed to fetch fact-check' });
    }
});

// Update fact-check status
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedTo, overallRating, notes } = req.body;

        const updates = [];
        const values = [];

        if (status) {
            updates.push('status = ?');
            values.push(status);
        }

        if (assignedTo !== undefined) {
            updates.push('assigned_to = ?');
            values.push(assignedTo);
        }

        if (overallRating) {
            updates.push('overall_rating = ?');
            values.push(overallRating);
        }

        if (notes) {
            updates.push('fact_checker_notes = ?');
            values.push(notes);
        }

        if (status === 'completed') {
            updates.push('completed_at = datetime("now")');
            updates.push('completed_by = ?');
            values.push(req.user.id);
        }

        values.push(id);

        await db.run(`
            UPDATE fact_checks
            SET ${updates.join(', ')}
            WHERE id = ?
        `, values);

        res.json({ success: true, message: 'Fact-check updated' });

    } catch (error) {
        console.error('Error updating fact-check:', error);
        res.status(500).json({ error: 'Failed to update fact-check' });
    }
});

// Verify a specific claim
router.post('/:factCheckId/claims/:claimId/verify', requireAuth, async (req, res) => {
    try {
        const { factCheckId, claimId } = req.params;
        const { status, rating, notes, sources, method, timeSpent } = req.body;

        // Create verification record
        const result = await db.run(`
            INSERT INTO claim_verifications (
                claim_id, verification_status, rating, verification_method,
                verification_notes, verified_by, verified_at, time_spent_seconds
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
        `, [claimId, status, rating, method || 'manual', notes, req.user.id, timeSpent || 0]);

        const verificationId = result.lastID;

        // Add sources if provided
        if (sources && Array.isArray(sources)) {
            for (let source of sources) {
                await db.run(`
                    INSERT INTO verification_sources (
                        verification_id, url, domain, title, credibility_tier,
                        credibility_score, supports_claim, relevance_score, excerpt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    verificationId,
                    source.url,
                    source.domain || new URL(source.url).hostname,
                    source.title || '',
                    source.credibilityTier || 'unknown',
                    source.credibilityScore || 0.5,
                    source.supportsClaim ? 1 : 0,
                    source.relevanceScore || 0.5,
                    source.excerpt || ''
                ]);
            }
        }

        // Update claim status
        await db.run(`
            UPDATE extracted_claims
            SET status = ?
            WHERE id = ?
        `, [status === 'verified_true' ? 'verified' : 'disputed', claimId]);

        res.json({
            success: true,
            verificationId,
            message: 'Claim verified successfully'
        });

    } catch (error) {
        console.error('Error verifying claim:', error);
        res.status(500).json({ error: 'Failed to verify claim' });
    }
});

// Get all fact-checks for an assignment
router.get('/assignment/:assignmentId', requireAuth, async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const factChecks = await db.all(`
            SELECT fc.*,
                   u1.name as created_by_name,
                   u2.name as assigned_to_name,
                   (SELECT COUNT(*) FROM extracted_claims WHERE fact_check_id = fc.id) as claim_count,
                   (SELECT COUNT(*) FROM extracted_claims WHERE fact_check_id = fc.id AND status = 'verified') as verified_count
            FROM fact_checks fc
            LEFT JOIN users u1 ON fc.created_by = u1.id
            LEFT JOIN users u2 ON fc.assigned_to = u2.id
            WHERE fc.assignment_id = ? OR fc.source_assignment_id = ?
            ORDER BY fc.created_at DESC
        `, [assignmentId, assignmentId]);

        res.json(factChecks);

    } catch (error) {
        console.error('Error fetching fact-checks:', error);
        res.status(500).json({ error: 'Failed to fetch fact-checks' });
    }
});

// Get claim types reference data
router.get('/meta/claim-types', requireAuth, async (req, res) => {
    try {
        const claimTypes = await db.all('SELECT * FROM claim_types ORDER BY type_name');
        res.json(claimTypes);
    } catch (error) {
        console.error('Error fetching claim types:', error);
        res.status(500).json({ error: 'Failed to fetch claim types' });
    }
});

// Get all pending fact-checks
router.get('/pending/all', requireAuth, async (req, res) => {
    try {
        const factChecks = await db.all(`
            SELECT fc.*,
                   u1.name as created_by_name,
                   (SELECT COUNT(*) FROM extracted_claims WHERE fact_check_id = fc.id) as claim_count,
                   (SELECT COUNT(*) FROM extracted_claims WHERE fact_check_id = fc.id AND status = 'pending') as pending_count
            FROM fact_checks fc
            LEFT JOIN users u1 ON fc.created_by = u1.id
            WHERE fc.status IN ('pending', 'in_progress', 'extracting_claims')
            ORDER BY fc.created_at DESC
        `);

        res.json(factChecks);
    } catch (error) {
        console.error('Error fetching pending fact-checks:', error);
        res.status(500).json({ error: 'Failed to fetch pending fact-checks' });
    }
});

// ============================================================
// NON-FACTUAL STATEMENTS API
// ============================================================

// Get all non-factual statement categories
router.get('/non-factual/categories', requireAuth, async (req, res) => {
    try {
        const categories = await db.all(`
            SELECT * FROM non_factual_categories
            ORDER BY category_name
        `);

        res.json(categories);
    } catch (error) {
        console.error('Error fetching non-factual categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get all non-factual statements with optional filters
router.get('/non-factual', requireAuth, async (req, res) => {
    try {
        const { category, sourceFile, limit, offset } = req.query;

        let query = `
            SELECT nfs.*,
                   nfc.category_name,
                   nfc.description as category_description,
                   u.name as created_by_name
            FROM non_factual_statements nfs
            LEFT JOIN non_factual_categories nfc ON nfs.reason_category = nfc.category_name
            LEFT JOIN users u ON nfs.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ` AND nfs.reason_category = ?`;
            params.push(category);
        }

        if (sourceFile) {
            query += ` AND nfs.source_file = ?`;
            params.push(sourceFile);
        }

        query += ` ORDER BY nfs.created_at DESC`;

        if (limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(limit));

            if (offset) {
                query += ` OFFSET ?`;
                params.push(parseInt(offset));
            }
        }

        const statements = await db.all(query, params);

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM non_factual_statements WHERE 1=1`;
        const countParams = [];

        if (category) {
            countQuery += ` AND reason_category = ?`;
            countParams.push(category);
        }

        if (sourceFile) {
            countQuery += ` AND source_file = ?`;
            countParams.push(sourceFile);
        }

        const { total } = await db.get(countQuery, countParams);

        res.json({
            statements,
            pagination: {
                total,
                limit: limit ? parseInt(limit) : null,
                offset: offset ? parseInt(offset) : 0
            }
        });

    } catch (error) {
        console.error('Error fetching non-factual statements:', error);
        res.status(500).json({ error: 'Failed to fetch non-factual statements' });
    }
});

// Get a specific non-factual statement
router.get('/non-factual/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const statement = await db.get(`
            SELECT nfs.*,
                   nfc.category_name,
                   nfc.description as category_description,
                   nfc.detection_keywords,
                   nfc.example_patterns,
                   u.name as created_by_name
            FROM non_factual_statements nfs
            LEFT JOIN non_factual_categories nfc ON nfs.reason_category = nfc.category_name
            LEFT JOIN users u ON nfs.created_by = u.id
            WHERE nfs.id = ?
        `, [id]);

        if (!statement) {
            return res.status(404).json({ error: 'Non-factual statement not found' });
        }

        res.json(statement);

    } catch (error) {
        console.error('Error fetching non-factual statement:', error);
        res.status(500).json({ error: 'Failed to fetch non-factual statement' });
    }
});

// Create a new non-factual statement record
router.post('/non-factual', requireAuth, async (req, res) => {
    try {
        const {
            factCheckId,
            statementText,
            reasonCategory,
            detailedExplanation,
            sourceFile,
            sourceContext,
            sentenceIndex,
            appearsFactualConfidence,
            keywordsDetected,
            examples
        } = req.body;

        if (!statementText || !reasonCategory || !detailedExplanation) {
            return res.status(400).json({
                error: 'statementText, reasonCategory, and detailedExplanation are required'
            });
        }

        const result = await db.run(`
            INSERT INTO non_factual_statements (
                fact_check_id, statement_text, reason_category, detailed_explanation,
                source_file, source_context, sentence_index, appears_factual_confidence,
                keywords_detected, examples, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            factCheckId || null,
            statementText,
            reasonCategory,
            detailedExplanation,
            sourceFile || null,
            sourceContext || null,
            sentenceIndex || null,
            appearsFactualConfidence || null,
            keywordsDetected ? JSON.stringify(keywordsDetected) : null,
            examples ? JSON.stringify(examples) : null,
            req.user.id
        ]);

        res.json({
            success: true,
            id: result.lastID,
            message: 'Non-factual statement recorded successfully'
        });

    } catch (error) {
        console.error('Error creating non-factual statement:', error);
        res.status(500).json({ error: 'Failed to create non-factual statement' });
    }
});

// Get non-factual statements by category
router.get('/non-factual/by-category/:category', requireAuth, async (req, res) => {
    try {
        const { category } = req.params;
        const { limit, offset } = req.query;

        let query = `
            SELECT nfs.*,
                   nfc.description as category_description,
                   u.name as created_by_name
            FROM non_factual_statements nfs
            LEFT JOIN non_factual_categories nfc ON nfs.reason_category = nfc.category_name
            LEFT JOIN users u ON nfs.created_by = u.id
            WHERE nfs.reason_category = ?
            ORDER BY nfs.created_at DESC
        `;
        const params = [category];

        if (limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(limit));

            if (offset) {
                query += ` OFFSET ?`;
                params.push(parseInt(offset));
            }
        }

        const statements = await db.all(query, params);
        const { total } = await db.get(
            'SELECT COUNT(*) as total FROM non_factual_statements WHERE reason_category = ?',
            [category]
        );

        res.json({
            category,
            statements,
            total
        });

    } catch (error) {
        console.error('Error fetching statements by category:', error);
        res.status(500).json({ error: 'Failed to fetch statements by category' });
    }
});

// Get non-factual statements by source file
router.get('/non-factual/by-file/:filename', requireAuth, async (req, res) => {
    try {
        const { filename } = req.params;

        const statements = await db.all(`
            SELECT nfs.*,
                   nfc.category_name,
                   nfc.description as category_description,
                   u.name as created_by_name
            FROM non_factual_statements nfs
            LEFT JOIN non_factual_categories nfc ON nfs.reason_category = nfc.category_name
            LEFT JOIN users u ON nfs.created_by = u.id
            WHERE nfs.source_file = ?
            ORDER BY nfs.sentence_index, nfs.created_at
        `, [filename]);

        // Get category breakdown
        const categoryBreakdown = await db.all(`
            SELECT reason_category, COUNT(*) as count
            FROM non_factual_statements
            WHERE source_file = ?
            GROUP BY reason_category
        `, [filename]);

        res.json({
            sourceFile: filename,
            statements,
            categoryBreakdown,
            total: statements.length
        });

    } catch (error) {
        console.error('Error fetching statements by file:', error);
        res.status(500).json({ error: 'Failed to fetch statements by file' });
    }
});

// Get statistics about non-factual statements
router.get('/non-factual/stats/summary', requireAuth, async (req, res) => {
    try {
        const totalStatements = await db.get('SELECT COUNT(*) as count FROM non_factual_statements');

        const byCategory = await db.all(`
            SELECT nfc.category_name, nfc.description, COUNT(nfs.id) as count
            FROM non_factual_categories nfc
            LEFT JOIN non_factual_statements nfs ON nfc.category_name = nfs.reason_category
            GROUP BY nfc.category_name
            ORDER BY count DESC
        `);

        const byFile = await db.all(`
            SELECT source_file, COUNT(*) as count
            FROM non_factual_statements
            WHERE source_file IS NOT NULL
            GROUP BY source_file
            ORDER BY count DESC
            LIMIT 10
        `);

        const avgConfidence = await db.get(`
            SELECT AVG(appears_factual_confidence) as avg_confidence
            FROM non_factual_statements
            WHERE appears_factual_confidence IS NOT NULL
        `);

        res.json({
            total: totalStatements.count,
            byCategory,
            topFiles: byFile,
            averageAppearsFactualConfidence: avgConfidence.avg_confidence
        });

    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Automated comparative claim verification
router.post('/:factCheckId/claims/:claimId/verify-comparative', requireAuth, async (req, res) => {
    try {
        const { factCheckId, claimId } = req.params;
        const { webSearchResults } = req.body; // Optional: pre-fetched search results

        // Get the claim
        const claim = await db.get(
            'SELECT * FROM extracted_claims WHERE id = ? AND fact_check_id = ?',
            [claimId, factCheckId]
        );

        if (!claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        // Detect comparative claim structure
        const detection = parser.detectComparativeClaim(claim.claim_text);

        if (!detection.is_comparative) {
            return res.status(400).json({
                error: 'Claim is not a comparative claim',
                suggestion: 'Use standard verification endpoint'
            });
        }

        // If web search results are not provided, return queries needed
        if (!webSearchResults) {
            // Generate search queries
            const queries = [];

            if (detection.is_temporal || detection.is_trend) {
                const metric = detection.metrics[0] || 'value';
                const currentQuery = parser.generateSearchQuery(metric, null);
                const historicalQuery = parser.generateSearchQuery(
                    metric,
                    detection.time_reference
                );

                queries.push({
                    type: 'current',
                    query: currentQuery,
                    purpose: 'Look up current/recent value'
                });

                queries.push({
                    type: 'historical',
                    query: historicalQuery,
                    purpose: `Look up value at ${detection.time_reference || 'past time'}`
                });
            } else {
                // Standard comparison
                const leftMetric = detection.verification_steps?.[0]?.left_metric || 'left value';
                const rightMetric = detection.verification_steps?.[0]?.right_metric || 'right value';

                queries.push({
                    type: 'left',
                    query: parser.generateSearchQuery(leftMetric, null),
                    purpose: `Look up ${leftMetric}`
                });

                queries.push({
                    type: 'right',
                    query: parser.generateSearchQuery(rightMetric, null),
                    purpose: `Look up ${rightMetric}`
                });
            }

            return res.json({
                message: 'Comparative claim detected. Provide search results to complete verification.',
                detection: {
                    comparison_type: detection.comparison_type,
                    is_temporal: detection.is_temporal,
                    is_trend: detection.is_trend,
                    metrics: detection.metrics,
                    time_reference: detection.time_reference
                },
                queries_needed: queries,
                instructions: 'Call this endpoint again with webSearchResults parameter containing results for each query'
            });
        }

        // Create WebSearch function from provided results
        const webSearchFn = async (query) => {
            // Find matching result from provided data
            const result = webSearchResults.find(r =>
                r.query === query || r.type === query
            );

            if (!result || !result.content) {
                throw new Error(`No search result provided for query: ${query}`);
            }

            return result.content;
        };

        // Initialize verifier with WebSearch function
        const verifier = new ComparativeVerifier(webSearchFn);

        // Add original sentence for verification
        detection.original_sentence = claim.claim_text;
        detection.text = claim.claim_text;

        // Perform automated verification
        const startTime = Date.now();
        const verification = await verifier.verify(detection, parser);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        // Store verification result
        const result = await db.run(`
            INSERT INTO claim_verifications (
                claim_id, verification_status, rating, verification_method,
                verification_notes, verified_by, verified_at, time_spent_seconds,
                comparison_type, left_value, right_value, calculated_result,
                expected_result, search_queries_used, data_extraction_log,
                calculation_steps, automated, sources_found
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            claimId,
            'completed',
            verification.verdict,
            'automated_comparative',
            JSON.stringify(verification.notes),
            req.user.id,
            timeSpent,
            verification.comparison_type,
            JSON.stringify(verification.left_value),
            JSON.stringify(verification.right_value),
            verification.calculated_result,
            verification.expected_result,
            JSON.stringify(verification.search_queries),
            JSON.stringify(verification.data_extraction_log),
            JSON.stringify(verification.calculation_steps),
            1, // automated = true
            JSON.stringify(verification.sources || [])
        ]);

        // Update claim status
        await db.run(
            'UPDATE extracted_claims SET status = ? WHERE id = ?',
            ['verified', claimId]
        );

        res.json({
            success: true,
            verification: {
                id: result.lastID,
                verdict: verification.verdict,
                confidence: verification.confidence,
                comparison_type: verification.comparison_type,
                left_value: verification.left_value,
                right_value: verification.right_value,
                calculated_result: verification.calculated_result,
                expected_result: verification.expected_result,
                notes: verification.notes,
                automated: true,
                time_spent_seconds: timeSpent
            }
        });

    } catch (error) {
        console.error('Error verifying comparative claim:', error);
        res.status(500).json({
            error: 'Failed to verify comparative claim',
            details: error.message
        });
    }
});

// Unified verification endpoint - automatically routes to appropriate verifier
router.post('/:factCheckId/claims/:claimId/verify-auto', requireAuth, async (req, res) => {
    try {
        const { factCheckId, claimId } = req.params;
        const { webSearchResults } = req.body;

        // Get the claim
        const claim = await db.get(
            'SELECT * FROM extracted_claims WHERE id = ? AND fact_check_id = ?',
            [claimId, factCheckId]
        );

        if (!claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        // Create WebSearch function if results provided
        const webSearchFn = webSearchResults ? (async (query) => {
            const result = webSearchResults.find(r => r.query === query || r.type === query);
            if (!result || !result.content) {
                throw new Error(`No search result provided for query: ${query}`);
            }
            return result.content;
        }) : null;

        // Initialize verification router
        const router = new VerificationRouter(webSearchFn);

        // Prepare claim object
        const claimObj = {
            text: claim.claim_text,
            type: claim.patterns_matched ? JSON.parse(claim.patterns_matched) : [],
            verification_type: claim.verification_type
        };

        // Route to appropriate verifier
        const startTime = Date.now();
        const result = await router.verifyClaim(claimObj, {
            deniabilityScore: claim.deniability_score || 0,
            deniabilityLabels: claim.patterns_matched ? JSON.parse(claim.patterns_matched) : [],
            fallbackActor: req.body.actor || ''
        });
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        if (!result.success) {
            return res.status(500).json({
                error: 'Verification failed',
                details: result.error
            });
        }

        // Store verification result based on method
        const verification = result.verification;
        const method = result.verification_method;

        let insertQuery, insertParams;

        if (method === 'comparative') {
            // Store comparative verification
            insertQuery = `
                INSERT INTO claim_verifications (
                    claim_id, verification_status, rating, verification_method,
                    verification_notes, verified_by, verified_at, time_spent_seconds,
                    comparison_type, left_value, right_value, calculated_result,
                    expected_result, search_queries_used, data_extraction_log,
                    calculation_steps, automated, sources_found
                ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            insertParams = [
                claimId,
                'completed',
                verification.verdict,
                'automated_comparative',
                JSON.stringify(verification.notes || []),
                req.user.id,
                timeSpent,
                verification.comparison_type,
                JSON.stringify(verification.left_value),
                JSON.stringify(verification.right_value),
                verification.calculated_result,
                verification.expected_result,
                JSON.stringify(verification.search_queries || []),
                JSON.stringify(verification.data_extraction_log || []),
                JSON.stringify(verification.calculation_steps || []),
                1,
                JSON.stringify(verification.sources || [])
            ];

        } else if (method === 'structured') {
            // Store structured verification
            insertQuery = `
                INSERT INTO claim_verifications (
                    claim_id, verification_status, rating, verification_method,
                    verification_notes, verified_by, verified_at, time_spent_seconds,
                    predicate, actor, action, object,
                    quantity_value, quantity_unit, quantity_direction,
                    time_reference, assertiveness, automated, sources_found
                ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            insertParams = [
                claimId,
                'completed',
                verification.verdict,
                'automated_structured',
                verification.notes || '',
                req.user.id,
                timeSpent,
                verification.predicate,
                verification.actor,
                verification.action,
                verification.object,
                verification.quantity?.value,
                verification.quantity?.unit,
                verification.quantity?.direction,
                verification.time?.as_text,
                verification.assertiveness,
                1,
                JSON.stringify(verification.evidence || [])
            ];

        } else {
            // Store standard verification
            insertQuery = `
                INSERT INTO claim_verifications (
                    claim_id, verification_status, rating, verification_method,
                    verification_notes, verified_by, verified_at, time_spent_seconds
                ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
            `;

            insertParams = [
                claimId,
                'pending',
                verification.verdict,
                'standard',
                verification.notes || '',
                req.user.id,
                timeSpent
            ];
        }

        const dbResult = await db.run(insertQuery, insertParams);

        // Update claim status
        await db.run(
            'UPDATE extracted_claims SET status = ? WHERE id = ?',
            ['verified', claimId]
        );

        res.json({
            success: true,
            verification_id: dbResult.lastID,
            method: method,
            verdict: verification.verdict,
            confidence: verification.confidence,
            time_spent_seconds: timeSpent,
            details: verification
        });

    } catch (error) {
        console.error('Error in unified verification:', error);
        res.status(500).json({
            error: 'Verification failed',
            details: error.message
        });
    }
});

module.exports = router;
