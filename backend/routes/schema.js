const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// Generate LD-JSON schema
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const { assignmentId, blocks } = req.body;

        const schemas = [];

        // Process each block and generate appropriate schema
        blocks.forEach(block => {
            if (block.type === 'event' && block.content) {
                schemas.push({
                    "@context": "https://schema.org",
                    "@type": "Event",
                    "name": block.content,
                    "description": block.data?.description || block.content,
                    "startDate": block.data?.date || new Date().toISOString(),
                    "location": {
                        "@type": "Place",
                        "name": block.data?.location || "TBD",
                        "address": block.data?.address || ""
                    }
                });
            } else if (block.type === 'quote' && block.content) {
                schemas.push({
                    "@context": "https://schema.org",
                    "@type": "Quotation",
                    "text": block.content,
                    "author": {
                        "@type": "Person",
                        "name": block.data?.author || "Campaign"
                    },
                    "datePublished": new Date().toISOString()
                });
            } else if (block.type === 'policy' && block.content) {
                schemas.push({
                    "@context": "https://schema.org",
                    "@type": "GovernmentService",
                    "name": block.data?.title || "Policy Initiative",
                    "description": block.content,
                    "provider": {
                        "@type": "GovernmentOrganization",
                        "name": "Campaign Office"
                    },
                    "audience": {
                        "@type": "Audience",
                        "name": block.data?.audience || "General Public"
                    }
                });
            }
        });

        // Save schema export
        if (assignmentId && schemas.length > 0) {
            await db.run(
                `INSERT INTO schema_exports (assignment_id, schema_data, platform, exported_by)
                 VALUES (?, ?, ?, ?)`,
                [
                    assignmentId,
                    JSON.stringify(schemas),
                    'web',
                    req.user.id
                ]
            );
        }

        res.json({
            schemas: schemas,
            count: schemas.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating schema:', error);
        res.status(500).json({ error: 'Failed to generate schema' });
    }
});

// Get schema history
router.get('/history/:assignmentId', requireAuth, async (req, res) => {
    try {
        const exports = await db.all(`
            SELECT s.*, u.name as exported_by_name
            FROM schema_exports s
            LEFT JOIN users u ON s.exported_by = u.id
            WHERE s.assignment_id = ?
            ORDER BY s.exported_at DESC
            LIMIT 10
        `, [req.params.assignmentId]);

        res.json(exports.map(e => ({
            ...e,
            schema_data: JSON.parse(e.schema_data)
        })));

    } catch (error) {
        console.error('Error fetching schema history:', error);
        res.status(500).json({ error: 'Failed to fetch schema history' });
    }
});

// Validate schema
router.post('/validate', requireAuth, async (req, res) => {
    try {
        const { schema } = req.body;

        // Basic validation checks
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check for required fields
        if (!schema['@context']) {
            validation.errors.push('Missing @context field');
            validation.valid = false;
        }

        if (!schema['@type']) {
            validation.errors.push('Missing @type field');
            validation.valid = false;
        }

        // Type-specific validation
        if (schema['@type'] === 'Event') {
            if (!schema.name) {
                validation.errors.push('Event requires a name');
                validation.valid = false;
            }
            if (!schema.startDate) {
                validation.warnings.push('Event should have a startDate');
            }
        }

        if (schema['@type'] === 'Quotation') {
            if (!schema.text) {
                validation.errors.push('Quotation requires text');
                validation.valid = false;
            }
            if (!schema.author) {
                validation.warnings.push('Quotation should have an author');
            }
        }

        res.json(validation);

    } catch (error) {
        console.error('Error validating schema:', error);
        res.status(500).json({ error: 'Failed to validate schema' });
    }
});

module.exports = router;