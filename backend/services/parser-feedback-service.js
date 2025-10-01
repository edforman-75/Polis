/**
 * Parser Feedback Service
 * Collects user corrections to improve parser accuracy over time
 */

const db = require('../database/init');

class ParserFeedbackService {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize feedback tables
     */
    async initializeDatabase() {
        if (this.initialized) return;
        this.initialized = true;
        const queries = [
            `CREATE TABLE IF NOT EXISTS parser_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                original_text TEXT NOT NULL,
                parsed_result TEXT NOT NULL,
                corrected_result TEXT NOT NULL,
                feedback_type TEXT,
                field_name TEXT,
                original_value TEXT,
                corrected_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS parser_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_type TEXT NOT NULL,
                pattern_text TEXT NOT NULL,
                confidence_score REAL DEFAULT 0.5,
                success_count INTEGER DEFAULT 0,
                failure_count INTEGER DEFAULT 0,
                example_text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS parser_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                field_type TEXT NOT NULL,
                total_parses INTEGER DEFAULT 0,
                correct_parses INTEGER DEFAULT 0,
                corrections_made INTEGER DEFAULT 0,
                accuracy_rate REAL DEFAULT 0.0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE INDEX IF NOT EXISTS idx_feedback_field ON parser_feedback(field_name)`,
            `CREATE INDEX IF NOT EXISTS idx_patterns_type ON parser_patterns(pattern_type)`,
            `CREATE INDEX IF NOT EXISTS idx_metrics_field ON parser_metrics(field_type)`
        ];

        try {
            for (const query of queries) {
                await db.run(query);
            }
            console.log('✅ Parser feedback tables initialized');
        } catch (error) {
            console.error('Error initializing parser feedback tables:', error);
        }
    }

    /**
     * Record a correction made by the user
     */
    async recordCorrection(data) {
        const {
            sessionId,
            originalText,
            parsedResult,
            correctedResult,
            feedbackType,
            fieldName,
            originalValue,
            correctedValue
        } = data;

        const result = await db.run(`
            INSERT INTO parser_feedback
            (session_id, original_text, parsed_result, corrected_result,
             feedback_type, field_name, original_value, corrected_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            sessionId || null,
            originalText,
            JSON.stringify(parsedResult),
            JSON.stringify(correctedResult),
            feedbackType,
            fieldName,
            originalValue,
            correctedValue
        ]);

        // Update metrics
        await this.updateMetrics(fieldName, false); // Correction means original parse was wrong

        return result.id;
    }

    /**
     * Record a successful parse (user didn't correct it)
     */
    async recordSuccess(fieldName) {
        await this.updateMetrics(fieldName, true);
    }

    /**
     * Update accuracy metrics
     */
    async updateMetrics(fieldType, wasCorrect) {
        // Get or create metric record
        let metric = await db.get(`
            SELECT * FROM parser_metrics WHERE field_type = ?
        `, [fieldType]);

        if (!metric) {
            await db.run(`
                INSERT INTO parser_metrics (field_type, total_parses, correct_parses, corrections_made)
                VALUES (?, 0, 0, 0)
            `, [fieldType]);
            metric = { total_parses: 0, correct_parses: 0, corrections_made: 0 };
        }

        const totalParses = metric.total_parses + 1;
        const correctParses = metric.correct_parses + (wasCorrect ? 1 : 0);
        const correctionsMade = metric.corrections_made + (wasCorrect ? 0 : 1);
        const accuracyRate = totalParses > 0 ? correctParses / totalParses : 0;

        await db.run(`
            UPDATE parser_metrics
            SET total_parses = ?,
                correct_parses = ?,
                corrections_made = ?,
                accuracy_rate = ?,
                last_updated = CURRENT_TIMESTAMP
            WHERE field_type = ?
        `, [totalParses, correctParses, correctionsMade, accuracyRate, fieldType]);
    }

    /**
     * Learn new patterns from corrections
     */
    async learnPattern(patternType, patternText, exampleText) {
        const existing = await db.get(`
            SELECT * FROM parser_patterns
            WHERE pattern_type = ? AND pattern_text = ?
        `, [patternType, patternText]);

        if (existing) {
            // Increase confidence for existing pattern
            await db.run(`
                UPDATE parser_patterns
                SET success_count = success_count + 1,
                    confidence_score = MIN(1.0, confidence_score + 0.1),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [existing.id]);
        } else {
            // Add new pattern
            await db.run(`
                INSERT INTO parser_patterns
                (pattern_type, pattern_text, example_text)
                VALUES (?, ?, ?)
            `, [patternType, patternText, exampleText]);
        }
    }

    /**
     * Get learned patterns for a specific type
     */
    async getLearnedPatterns(patternType, minConfidence = 0.6) {
        return await db.all(`
            SELECT * FROM parser_patterns
            WHERE pattern_type = ? AND confidence_score >= ?
            ORDER BY confidence_score DESC, success_count DESC
        `, [patternType, minConfidence]);
    }

    /**
     * Get parser performance metrics
     */
    async getMetrics(fieldType = null) {
        if (fieldType) {
            return await db.get(`
                SELECT * FROM parser_metrics WHERE field_type = ?
            `, [fieldType]);
        } else {
            return await db.all(`
                SELECT * FROM parser_metrics
                ORDER BY accuracy_rate ASC
            `);
        }
    }

    /**
     * Get recent feedback for analysis
     */
    async getRecentFeedback(limit = 100) {
        return await db.all(`
            SELECT * FROM parser_feedback
            ORDER BY created_at DESC
            LIMIT ?
        `, [limit]);
    }

    /**
     * Analyze corrections to find common patterns
     */
    async analyzeCorrections(fieldName) {
        const corrections = await db.all(`
            SELECT original_value, corrected_value, COUNT(*) as frequency
            FROM parser_feedback
            WHERE field_name = ? AND corrected_value IS NOT NULL
            GROUP BY original_value, corrected_value
            ORDER BY frequency DESC
            LIMIT 20
        `, [fieldName]);

        return corrections;
    }

    /**
     * Get smart suggestions for a field based on similar past corrections
     */
    async getSmartSuggestions(fieldName, currentValue, limit = 5) {
        // Find similar corrections
        const suggestions = await db.all(`
            SELECT corrected_value, COUNT(*) as frequency,
                   AVG(LENGTH(corrected_value) - LENGTH(original_value)) as avg_change
            FROM parser_feedback
            WHERE field_name = ?
              AND original_value LIKE ?
              AND corrected_value IS NOT NULL
              AND corrected_value != original_value
            GROUP BY corrected_value
            ORDER BY frequency DESC, avg_change DESC
            LIMIT ?
        `, [fieldName, `%${currentValue.substring(0, 20)}%`, limit]);

        return suggestions.map(s => ({
            text: s.corrected_value,
            confidence: Math.min(0.95, s.frequency / 10), // Cap at 95%
            frequency: s.frequency
        }));
    }

    /**
     * Predict if a parsed value is likely wrong
     */
    async predictError(fieldName, value) {
        const metric = await this.getMetrics(fieldName);

        if (!metric || metric.total_parses < 10) {
            return { likelyWrong: false, confidence: 0 };
        }

        // Check if similar values were often corrected
        const similarCorrections = await db.get(`
            SELECT COUNT(*) as correction_count
            FROM parser_feedback
            WHERE field_name = ?
              AND original_value LIKE ?
              AND corrected_value != original_value
        `, [fieldName, `%${value.substring(0, 30)}%`]);

        const errorRate = metric.corrections_made / metric.total_parses;
        const similarErrorRate = similarCorrections ?
            (similarCorrections.correction_count / metric.total_parses) : 0;

        const confidence = Math.max(errorRate, similarErrorRate);

        const suggestions = confidence > 0.5 ? await this.getSmartSuggestions(fieldName, value, 1) : [];

        return {
            likelyWrong: confidence > 0.3,
            confidence: confidence,
            suggestion: suggestions[0] || null
        };
    }

    /**
     * Get suggestions for improving parser based on feedback
     */
    async getSuggestions() {
        const suggestions = [];

        // Find fields with low accuracy
        const lowAccuracyFields = await db.all(`
            SELECT * FROM parser_metrics
            WHERE accuracy_rate < 0.7 AND total_parses > 10
            ORDER BY accuracy_rate ASC
        `);

        for (const field of lowAccuracyFields) {
            const commonCorrections = await this.analyzeCorrections(field.field_type);
            if (commonCorrections.length > 0) {
                suggestions.push({
                    field: field.field_type,
                    accuracy: field.accuracy_rate,
                    issue: 'Low accuracy - review patterns',
                    commonCorrections: commonCorrections.slice(0, 3)
                });
            }
        }

        return suggestions;
    }
}

module.exports = new ParserFeedbackService();
