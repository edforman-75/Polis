const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const {
    saveParsedPressRelease,
    updateParsedPressRelease,
    getParsedPressRelease,
    listParsedPressReleases,
    deleteParsedPressRelease,
    searchParsedPressReleases
} = require('../database/parsed-press-releases');

// List all Spanberger press releases
router.get('/list', async (req, res) => {
    try {
        const cpoExamplesDir = path.join(__dirname, '../../cpo_examples');
        const files = await fs.readdir(cpoExamplesDir);

        // Filter for Spanberger press releases
        const spanbergerFiles = files.filter(file =>
            file.startsWith('spanberger_') && file.endsWith('.txt')
        );

        // Read first line of each file to get title
        const releases = await Promise.all(
            spanbergerFiles.map(async (filename) => {
                const filePath = path.join(cpoExamplesDir, filename);
                const content = await fs.readFile(filePath, 'utf-8');
                const firstLine = content.split('\n')[0].trim();

                return {
                    filename,
                    title: firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine
                };
            })
        );

        // Sort by filename
        releases.sort((a, b) => a.filename.localeCompare(b.filename));

        res.json({
            success: true,
            releases
        });

    } catch (error) {
        console.error('Error listing press releases:', error);
        res.status(500).json({
            error: 'Failed to list press releases',
            details: error.message
        });
    }
});

// Load a specific press release
router.get('/load/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Security: only allow spanberger txt files
        if (!filename.startsWith('spanberger_') || !filename.endsWith('.txt')) {
            return res.status(400).json({
                error: 'Invalid filename'
            });
        }

        const filePath = path.join(__dirname, '../../cpo_examples', filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                error: 'Press release not found'
            });
        }

        const content = await fs.readFile(filePath, 'utf-8');

        res.json({
            success: true,
            filename,
            content
        });

    } catch (error) {
        console.error('Error loading press release:', error);
        res.status(500).json({
            error: 'Failed to load press release',
            details: error.message
        });
    }
});

// Save parsed press release
router.post('/save-parsed', async (req, res) => {
    console.log('📥 Received save-parsed request');
    try {
        const {
            id,
            title,
            content,
            parsed_data
        } = req.body;

        console.log('📋 Request data:', { id, title: title?.substring(0, 50), hasContent: !!content, hasParsedData: !!parsed_data });

        if (!title || !content) {
            console.log('❌ Validation failed: missing title or content');
            return res.status(400).json({
                error: 'Title and content are required'
            });
        }

        // Extract key fields from parsed_data (handle both flat and nested structures)
        const release_type = req.body.release_type || parsed_data?.release_type?.type || null;
        const release_subtype = req.body.release_subtype || parsed_data?.release_type?.subtype || null;
        const confidence = req.body.confidence || parsed_data?.release_type?.confidence || null;
        const subtypes = req.body.subtypes || parsed_data?.subtypes || [];
        const issues = req.body.issues || parsed_data?.issues || [];
        const metadata = req.body.metadata || parsed_data?.metadata || {};
        const reviewed_by = req.body.reviewed_by !== undefined ? req.body.reviewed_by : null;

        console.log('🔍 Extracted fields:', { release_type, subtypes: subtypes.length, issues: issues.length });

        const saveData = {
            title,
            content,
            release_type,
            release_subtype,
            confidence,
            subtypes,
            issues,
            metadata,
            parsed_data,
            source_file: req.body.source_file || null,
            reviewed_by
        };

        console.log('💾 Calling database save function...');
        let result;
        if (id) {
            // Update existing
            console.log('📝 Updating existing release:', id);
            result = await updateParsedPressRelease(id, saveData);
        } else {
            // Check for duplicates before creating new
            const db = require('../database/init');
            const existing = await db.get(
                'SELECT id FROM parsed_press_releases WHERE title = ?',
                [title]
            );

            if (existing) {
                console.log('⚠️  Duplicate detected! Updating existing ID:', existing.id);
                result = await updateParsedPressRelease(existing.id, saveData);
                result.id = existing.id;
            } else {
                // Create new
                console.log('✨ Creating new release');
                result = await saveParsedPressRelease(saveData);
            }
        }

        console.log('✅ Database save successful:', result);

        res.json({
            success: true,
            id: result.id || id,
            message: id ? 'Press release updated' : 'Press release saved'
        });

    } catch (error) {
        console.error('❌ Error saving parsed press release:', error);
        res.status(500).json({
            error: 'Failed to save press release',
            details: error.message
        });
    }
});

// Get a saved parsed press release
router.get('/parsed/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const release = await getParsedPressRelease(id);

        if (!release) {
            return res.status(404).json({
                error: 'Press release not found'
            });
        }

        res.json({
            success: true,
            release
        });

    } catch (error) {
        console.error('Error getting parsed press release:', error);
        res.status(500).json({
            error: 'Failed to get press release',
            details: error.message
        });
    }
});

// List saved parsed press releases
router.get('/parsed', async (req, res) => {
    try {
        const { limit, offset, release_type } = req.query;

        const releases = await listParsedPressReleases({
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
            release_type: release_type || null
        });

        res.json({
            success: true,
            releases
        });

    } catch (error) {
        console.error('Error listing parsed press releases:', error);
        res.status(500).json({
            error: 'Failed to list press releases',
            details: error.message
        });
    }
});

// Delete a saved parsed press release
router.delete('/parsed/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteParsedPressRelease(id);

        if (!result.deleted) {
            return res.status(404).json({
                error: 'Press release not found'
            });
        }

        res.json({
            success: true,
            message: 'Press release deleted'
        });

    } catch (error) {
        console.error('Error deleting parsed press release:', error);
        res.status(500).json({
            error: 'Failed to delete press release',
            details: error.message
        });
    }
});

// Search parsed press releases
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                error: 'Search query (q) is required'
            });
        }

        const releases = await searchParsedPressReleases(q);

        res.json({
            success: true,
            releases
        });

    } catch (error) {
        console.error('Error searching parsed press releases:', error);
        res.status(500).json({
            error: 'Failed to search press releases',
            details: error.message
        });
    }
});

// Review queue endpoint with intelligent filtering
router.get('/review-queue', async (req, res) => {
    try {
        const { filter = 'needs_review' } = req.query;
        const db = require('../database/init');

        let whereClause = '';
        let orderClause = 'ORDER BY created_at DESC';
        let limitClause = 'LIMIT 50';
        let params = [];

        switch (filter) {
            case 'flagged':
                // ICYMI not marked as media_appearance OR contains DOGE without federal_workforce tag
                whereClause = `WHERE (title LIKE '%ICYMI%' AND release_type != 'media_appearance')
                              OR (reviewed_by IS NULL AND id >= 29)`;
                break;
            case 'low_confidence':
                whereClause = 'WHERE confidence < 0.85 AND reviewed_by IS NULL';
                break;
            case 'random_sample':
                whereClause = 'WHERE reviewed_by IS NULL';
                orderClause = 'ORDER BY RANDOM()';
                limitClause = 'LIMIT 5';
                break;
            case 'all_unreviewed':
                whereClause = 'WHERE reviewed_by IS NULL';
                break;
            case 'needs_review':
                whereClause = `WHERE reviewed_by IS NULL AND (
                    confidence < 0.85
                    OR title LIKE '%ICYMI%'
                    OR id >= 29
                )`;
                break;
            case 'all':
                whereClause = '';
                break;
        }

        const sql = `
            SELECT id, title, content, release_type, release_subtype, confidence,
                   subtypes, issues, metadata, parsed_data, source_file, reviewed_by,
                   created_at
            FROM parsed_press_releases
            ${whereClause}
            ${orderClause}
            ${limitClause}
        `;

        const releases = await db.all(sql, params);

        // Parse JSON fields
        const processedReleases = releases.map(r => ({
            ...r,
            subtypes: JSON.parse(r.subtypes || '[]'),
            issues: JSON.parse(r.issues || '[]'),
            metadata: JSON.parse(r.metadata || '{}'),
            parsed_data: JSON.parse(r.parsed_data || '{}')
        }));

        // Get stats
        const statsQuery = await db.all(`
            SELECT
                COUNT(CASE WHEN reviewed_by IS NULL THEN 1 END) as needs_review,
                COUNT(CASE WHEN reviewed_by IS NOT NULL THEN 1 END) as reviewed,
                COUNT(CASE WHEN reviewed_by IS NULL AND (confidence < 0.85 OR title LIKE '%ICYMI%') THEN 1 END) as flagged
            FROM parsed_press_releases
        `);

        res.json({
            success: true,
            releases: processedReleases,
            stats: statsQuery[0]
        });

    } catch (error) {
        console.error('Error fetching review queue:', error);
        res.status(500).json({
            error: 'Failed to fetch review queue',
            details: error.message
        });
    }
});

// Export review data as CSV
router.get('/review-export', async (req, res) => {
    try {
        const db = require('../database/init');

        const releases = await db.all(`
            SELECT id, title, release_type, subtypes, issues, confidence, reviewed_by, source_file, created_at
            FROM parsed_press_releases
            ORDER BY created_at DESC
        `);

        // Create CSV
        const headers = ['ID', 'Title', 'Type', 'Subtypes', 'Issues', 'Confidence', 'Reviewed By', 'Source File', 'Created At'];
        const rows = releases.map(r => [
            r.id,
            `"${(r.title || '').replace(/"/g, '""')}"`,
            r.release_type || '',
            `"${r.subtypes || ''}"`,
            `"${r.issues || ''}"`,
            r.confidence || '',
            r.reviewed_by || '',
            r.source_file || '',
            r.created_at || ''
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=review-export.csv');
        res.send(csv);

    } catch (error) {
        console.error('Error exporting review data:', error);
        res.status(500).json({
            error: 'Failed to export review data',
            details: error.message
        });
    }
});

module.exports = router;
