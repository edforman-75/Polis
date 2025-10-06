const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Initialize SQLite database for drafts
const dbPath = path.join(__dirname, '../../data/drafts.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Create drafts table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        stage INTEGER DEFAULT 1,
        raw_text TEXT,
        sections TEXT,
        metadata TEXT,
        recommendations TEXT
    )
`);

// Save draft
router.post('/drafts/save', (req, res) => {
    try {
        const { timestamp, document, stage } = req.body;

        const stmt = db.prepare(`
            INSERT INTO drafts (created_at, updated_at, stage, raw_text, sections, metadata, recommendations)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            timestamp,
            timestamp,
            stage || 1,
            document.raw || '',
            JSON.stringify(document.sections || {}),
            JSON.stringify(document.metadata || {}),
            JSON.stringify(document.recommendations || [])
        );

        res.json({
            success: true,
            draftId: result.lastInsertRowid,
            timestamp
        });
    } catch (error) {
        console.error('Error saving draft:', error);
        res.status(500).json({ error: 'Failed to save draft' });
    }
});

// Load draft
router.get('/drafts/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM drafts WHERE id = ?');
        const draft = stmt.get(req.params.id);

        if (!draft) {
            return res.status(404).json({ error: 'Draft not found' });
        }

        res.json({
            id: draft.id,
            created_at: draft.created_at,
            updated_at: draft.updated_at,
            stage: draft.stage,
            document: {
                raw: draft.raw_text,
                sections: JSON.parse(draft.sections),
                metadata: JSON.parse(draft.metadata),
                recommendations: JSON.parse(draft.recommendations)
            }
        });
    } catch (error) {
        console.error('Error loading draft:', error);
        res.status(500).json({ error: 'Failed to load draft' });
    }
});

// List all drafts
router.get('/drafts', (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, created_at, updated_at, stage FROM drafts ORDER BY updated_at DESC LIMIT 50');
        const drafts = stmt.all();

        res.json({ drafts });
    } catch (error) {
        console.error('Error listing drafts:', error);
        res.status(500).json({ error: 'Failed to list drafts' });
    }
});

// Delete draft
router.delete('/drafts/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM drafts WHERE id = ?');
        stmt.run(req.params.id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting draft:', error);
        res.status(500).json({ error: 'Failed to delete draft' });
    }
});

// LLM proxy endpoint (for AI suggestions)
router.post('/llm', async (req, res) => {
    try {
        const { system, prompt, temperature = 0.3, maxTokens = 180, provider = 'auto', model = 'auto' } = req.body;

        // TODO: Integrate with actual LLM API (OpenAI, Anthropic, etc.)
        // For now, return a mock response

        // Check if OpenAI API key is available
        if (process.env.OPENAI_API_KEY) {
            const { OpenAI } = require('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const completion = await openai.chat.completions.create({
                model: model === 'auto' ? 'gpt-4o-mini' : model,
                messages: [
                    { role: 'system', content: system || 'You are a helpful campaign communications assistant.' },
                    { role: 'user', content: prompt }
                ],
                temperature: temperature,
                max_tokens: maxTokens
            });

            res.json({
                text: completion.choices[0].message.content
            });
        } else {
            // Mock response if no API key
            res.json({
                text: `[Mock LLM Response] Suggestion for: ${prompt.substring(0, 50)}...`
            });
        }
    } catch (error) {
        console.error('LLM proxy error:', error);
        res.status(500).json({ error: 'LLM request failed' });
    }
});

// Compliance check endpoint
router.post('/compliance/check', async (req, res) => {
    try {
        const { text } = req.body;

        // TODO: Integrate with cpo_linter.py and detect_pd.py
        // For now, return mock compliance results

        const issues = [];

        // FEC disclaimer check
        if (!text.match(/paid for by/i)) {
            issues.push({
                type: 'fec_disclaimer',
                severity: 'blocking',
                title: 'Missing FEC Disclaimer',
                description: 'Federal law requires "Paid for by" disclaimer on campaign communications.',
                suggestion: 'Paid for by [Campaign Name]. Not authorized by any candidate or candidate\'s committee.'
            });
        }

        // Plausible deniability phrases (mock detect_pd.py)
        const pdPhrases = [
            { phrase: 'some say', severity: 'warning' },
            { phrase: 'many believe', severity: 'warning' },
            { phrase: 'it is said', severity: 'warning' },
            { phrase: 'critics claim', severity: 'warning' }
        ];

        pdPhrases.forEach(({ phrase, severity }) => {
            if (text.toLowerCase().includes(phrase)) {
                issues.push({
                    type: 'plausible_deniability',
                    severity,
                    title: 'Evasive Language Detected',
                    description: `Phrase "${phrase}" weakens credibility. Use direct attribution or remove.`,
                    suggestion: `Replace "${phrase}" with specific source: "According to [Source], ..." or state directly.`
                });
            }
        });

        // Unsupported claims
        const claimPatterns = [
            /\d+%/g,  // Percentages
            /study shows/i,
            /research indicates/i,
            /according to/i
        ];

        claimPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                issues.push({
                    type: 'unsupported_claim',
                    severity: 'warning',
                    title: 'Potential Unsupported Claim',
                    description: `Found claim that may require citation: "${matches[0]}"`,
                    suggestion: 'Add citation or link to source material.'
                });
            }
        });

        res.json({
            success: true,
            issues,
            summary: {
                blocking: issues.filter(i => i.severity === 'blocking').length,
                warnings: issues.filter(i => i.severity === 'warning').length,
                suggestions: issues.filter(i => i.severity === 'suggestion').length
            }
        });
    } catch (error) {
        console.error('Compliance check error:', error);
        res.status(500).json({ error: 'Compliance check failed' });
    }
});

// Metadata/JSON-LD generation endpoint
router.post('/metadata/generate', (req, res) => {
    try {
        const { text, sections } = req.body;

        // Generate basic JSON-LD structure
        const jsonld = {
            '@context': ['https://schema.org', 'https://campaign-press-ontology.org/ns/v1#'],
            '@type': 'PressRelease',
            'headline': sections.headline || '',
            'datePublished': new Date().toISOString().split('T')[0],
            'articleBody': text,
            'author': {
                '@type': 'Organization',
                'name': '[Campaign Name]'
            },
            'publisher': {
                '@type': 'Organization',
                'name': '[Campaign Name]'
            }
        };

        // Attempt to extract additional metadata
        // Date
        const dateMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/i);
        if (dateMatch) {
            jsonld.datePublished = new Date(dateMatch[0]).toISOString().split('T')[0];
        }

        // Location
        const locationPatterns = [
            /\b([A-Z][A-Za-z]+,\s+[A-Z]{2})\b/,  // City, ST
            /\b([A-Z][A-Za-z\s]+,\s+[A-Z][a-z]+)\b/  // City, State
        ];
        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match) {
                jsonld.contentLocation = {
                    '@type': 'Place',
                    'name': match[1]
                };
                break;
            }
        }

        // CTA detection
        const ctaPatterns = [
            { pattern: /donate/i, type: 'Donate' },
            { pattern: /volunteer/i, type: 'Volunteer' },
            { pattern: /rsvp|register/i, type: 'Register' }
        ];
        for (const { pattern, type } of ctaPatterns) {
            if (pattern.test(text)) {
                jsonld['cpo:cta'] = {
                    '@type': 'cpo:CTA',
                    'cpo:ctaType': type,
                    'url': '[CTA URL]'
                };
                break;
            }
        }

        res.json({
            success: true,
            jsonld
        });
    } catch (error) {
        console.error('Metadata generation error:', error);
        res.status(500).json({ error: 'Metadata generation failed' });
    }
});

module.exports = router;
