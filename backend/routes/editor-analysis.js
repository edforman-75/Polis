/**
 * Editor Analysis Routes - Real-time content analysis for live editing
 */

const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze a single field's content in real-time
 * POST /api/editor/analyze-field
 */
router.post('/analyze-field', async (req, res) => {
    try {
        const { field, content, settings } = req.body;

        if (!field || !content) {
            return res.status(400).json({ error: 'Missing field or content' });
        }

        console.log(`🔍 Analyzing field: ${field}`);

        // Get enabled edit checks from settings
        const enabledChecks = await getEnabledEditChecks(settings);

        // Build analysis prompt
        const prompt = buildAnalysisPrompt(field, content, enabledChecks, settings);

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: getSystemPrompt(settings) },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        const response = completion.choices[0].message.content;

        // Parse suggestions from response
        const suggestions = parseSuggestions(response, field);

        // Filter by confidence threshold
        const filtered = suggestions.filter(s =>
            !settings.min_confidence_to_show ||
            s.confidence >= settings.min_confidence_to_show
        );

        res.json({
            field,
            suggestions: filtered,
            analyzed_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error analyzing field:', error);
        res.status(500).json({
            error: 'Analysis failed',
            details: error.message
        });
    }
});

/**
 * Analyze all fields at once
 * POST /api/editor/analyze-all
 */
router.post('/analyze-all', async (req, res) => {
    try {
        const { fields, settings } = req.body;

        if (!fields || typeof fields !== 'object') {
            return res.status(400).json({ error: 'Missing fields object' });
        }

        console.log(`🔍 Analyzing ${Object.keys(fields).length} fields`);

        const allSuggestions = [];

        // Analyze each field
        for (const [fieldName, content] of Object.entries(fields)) {
            if (!content || content.trim().length === 0) continue;

            const enabledChecks = await getEnabledEditChecks(settings);
            const prompt = buildAnalysisPrompt(fieldName, content, enabledChecks, settings);

            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: getSystemPrompt(settings) },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                });

                const response = completion.choices[0].message.content;
                const suggestions = parseSuggestions(response, fieldName);
                allSuggestions.push(...suggestions);
            } catch (error) {
                console.error(`Error analyzing ${fieldName}:`, error);
            }
        }

        // Filter by confidence
        const filtered = allSuggestions.filter(s =>
            !settings.min_confidence_to_show ||
            s.confidence >= settings.min_confidence_to_show
        );

        res.json({
            suggestions: filtered,
            fields_analyzed: Object.keys(fields).length,
            analyzed_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error analyzing all fields:', error);
        res.status(500).json({
            error: 'Analysis failed',
            details: error.message
        });
    }
});

/**
 * Get system prompt based on settings
 */
function getSystemPrompt(settings) {
    const assistanceLevel = settings?.ai_assistance_level || 'balanced';

    const prompts = {
        minimal: `You are a press release editor. Only flag clear errors and AP Style violations. Be conservative with suggestions.`,

        balanced: `You are an expert press release editor. Analyze content for AP Style compliance, grammar issues, and voice consistency. Provide clear, actionable suggestions with confidence scores.`,

        aggressive: `You are a senior press release editor with high standards. Thoroughly analyze content for all issues: AP Style, grammar, voice, clarity, political messaging, and enhancement opportunities. Be comprehensive.`
    };

    return prompts[assistanceLevel] || prompts.balanced;
}

/**
 * Build analysis prompt for a field
 */
function buildAnalysisPrompt(field, content, enabledChecks, settings) {
    const checkCategories = [...new Set(enabledChecks.map(c => c.check_category))];

    return `Analyze this press release field for issues.

**Field**: ${formatFieldName(field)}
**Content**: "${content}"

**Check for these categories**:
${checkCategories.map(cat => `- ${cat}`).join('\n')}

**Enabled Checks**:
${enabledChecks.map(c => `- ${c.check_display_name} (${c.check_category})`).join('\n')}

Return suggestions in this JSON format:
\`\`\`json
[
    {
        "id": "unique-id",
        "category": "ap-style|grammar|voice|enhancement|political|seo",
        "severity": "error|warning|suggestion",
        "before": "text to replace",
        "after": "suggested replacement",
        "reason": "clear explanation why this change is needed",
        "confidence": 0.95
    }
]
\`\`\`

**Rules**:
- Only flag issues that match enabled checks
- Use "error" severity for AP Style violations and grammar mistakes
- Use "warning" severity for voice/tone issues
- Use "suggestion" severity for enhancements
- Confidence should be 0.0-1.0 (0.8+ for errors, 0.6+ for warnings)
- Keep explanations concise but clear
- Only include actionable suggestions with specific replacements`;
}

/**
 * Parse suggestions from OpenAI response
 */
function parseSuggestions(responseText, field) {
    try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        const jsonText = jsonMatch ? jsonMatch[1] : responseText;

        const suggestions = JSON.parse(jsonText);

        if (!Array.isArray(suggestions)) {
            console.error('Response is not an array:', suggestions);
            return [];
        }

        // Add field name and generate IDs if missing
        return suggestions.map((s, index) => ({
            id: s.id || `${field}-${Date.now()}-${index}`,
            field,
            category: s.category || 'enhancement',
            severity: s.severity || 'suggestion',
            before: s.before || '',
            after: s.after || '',
            reason: s.reason || '',
            confidence: s.confidence !== undefined ? s.confidence : 0.7,
            status: 'pending',
            created_at: new Date().toISOString()
        }));

    } catch (error) {
        console.error('Error parsing suggestions:', error);
        console.error('Response text:', responseText);
        return [];
    }
}

/**
 * Get enabled edit checks from database
 */
async function getEnabledEditChecks(settings) {
    // If settings provided specific checks, use those
    if (settings?.enabled_checks) {
        return settings.enabled_checks;
    }

    // Otherwise return default checks
    return [
        { check_category: 'ap-style', check_display_name: 'AP Style Compliance', severity: 'error' },
        { check_category: 'grammar', check_display_name: 'Grammar & Spelling', severity: 'error' },
        { check_category: 'voice', check_display_name: 'Voice Consistency', severity: 'warning' },
        { check_category: 'enhancement', check_display_name: 'Content Enhancement', severity: 'suggestion' }
    ];
}

/**
 * Format field name for display
 */
function formatFieldName(field) {
    return field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

module.exports = router;
