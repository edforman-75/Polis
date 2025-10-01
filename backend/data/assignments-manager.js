const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class AssignmentsManager {
    constructor(dbPath = './data/assignments.db') {
        this.dbPath = dbPath;
        this.db = null;
    }

    // Initialize database and create tables
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening assignments database:', err);
                    reject(err);
                    return;
                }

                console.log('📊 Assignments database connected');

                // Read and execute schema
                const schemaPath = path.join(__dirname, 'assignments-schema.sql');
                const schema = fs.readFileSync(schemaPath, 'utf8');

                this.db.exec(schema, (err) => {
                    if (err) {
                        console.error('Error creating assignments schema:', err);
                        reject(err);
                    } else {
                        console.log('✅ Assignments schema initialized');
                        resolve();
                    }
                });
            });
        });
    }

    // Create a new assignment
    async createAssignment(data) {
        const {
            title,
            originalText,
            submittedBy,
            parsedFields,
            parserConfidence
        } = data;

        const slug = this.generateSlug(title);

        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO assignments (
                    title, slug, status, original_text, submitted_by,
                    parsed_fields, parser_confidence, parsed_at, parsed_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'system')
            `;

            this.db.run(sql, [
                title,
                slug,
                'needs_validation',
                originalText,
                submittedBy,
                JSON.stringify(parsedFields),
                parserConfidence
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✅ Assignment created: ${slug} (ID: ${this.lastID})`);

                    // Create original version snapshot
                    const versionSql = `
                        INSERT INTO assignment_versions (
                            assignment_id, version_type, version_number,
                            created_by, fields_json
                        ) VALUES (?, 'original', 1, ?, ?)
                    `;

                    this.db.run(versionSql, [
                        this.lastID,
                        submittedBy || 'unknown',
                        JSON.stringify(parsedFields)
                    ]);

                    resolve({ id: this.lastID, slug });
                }
            }.bind(this));
        });
    }

    // Get assignments for Parser Reviewer dashboard
    async getAssignmentsNeedingValidation() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    id, title, slug, status, priority,
                    submitted_by, submitted_at,
                    parsed_at, parser_confidence,
                    validation_started_by, validation_started_at
                FROM assignments
                WHERE status IN ('needs_validation', 'validating')
                ORDER BY
                    CASE priority
                        WHEN 'urgent' THEN 1
                        WHEN 'high' THEN 2
                        WHEN 'normal' THEN 3
                        WHEN 'low' THEN 4
                    END,
                    submitted_at DESC
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get assignments for Content Editor dashboard
    async getAssignmentsNeedingEditing() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    id, title, slug, status, priority,
                    submitted_by, submitted_at,
                    validation_completed_by, validation_completed_at,
                    validation_corrections_count,
                    editing_started_by, editing_started_at,
                    quality_score
                FROM assignments
                WHERE status IN ('validated', 'editing')
                ORDER BY
                    CASE priority
                        WHEN 'urgent' THEN 1
                        WHEN 'high' THEN 2
                        WHEN 'normal' THEN 3
                        WHEN 'low' THEN 4
                    END,
                    validation_completed_at DESC
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Start validation (Parser Reviewer claims assignment)
    async startValidation(assignmentId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE assignments
                SET status = 'validating',
                    validation_started_at = CURRENT_TIMESTAMP,
                    validation_started_by = ?
                WHERE id = ? AND status = 'needs_validation'
            `;

            this.db.run(sql, [userId, assignmentId], function(err) {
                if (err) reject(err);
                else if (this.changes === 0) reject(new Error('Assignment already claimed or not found'));
                else {
                    console.log(`🔍 Validation started on assignment ${assignmentId} by ${userId}`);
                    resolve();
                }
            });
        });
    }

    // Complete validation
    async completeValidation(assignmentId, userId, validatedFields, correctionsCount, timeSpent) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE assignments
                SET status = 'validated',
                    validation_completed_at = CURRENT_TIMESTAMP,
                    validation_completed_by = ?,
                    validated_fields = ?,
                    validation_corrections_count = ?,
                    validation_time_seconds = ?
                WHERE id = ? AND status = 'validating'
            `;

            this.db.run(sql, [
                userId,
                JSON.stringify(validatedFields),
                correctionsCount,
                timeSpent,
                assignmentId
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✅ Validation completed on assignment ${assignmentId}`);

                    // Create validated version snapshot
                    const versionSql = `
                        INSERT INTO assignment_versions (
                            assignment_id, version_type, version_number,
                            created_by, fields_json
                        ) VALUES (?, 'validated', 1, ?, ?)
                    `;

                    this.db.run(versionSql, [
                        assignmentId,
                        userId,
                        JSON.stringify(validatedFields)
                    ]);

                    resolve();
                }
            }.bind(this));
        });
    }

    // Start editing (Content Editor claims assignment)
    async startEditing(assignmentId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE assignments
                SET status = 'editing',
                    editing_started_at = CURRENT_TIMESTAMP,
                    editing_started_by = ?
                WHERE id = ? AND status = 'validated'
            `;

            this.db.run(sql, [userId, assignmentId], function(err) {
                if (err) reject(err);
                else if (this.changes === 0) reject(new Error('Assignment not ready for editing or not found'));
                else {
                    console.log(`✏️ Editing started on assignment ${assignmentId} by ${userId}`);
                    resolve();
                }
            });
        });
    }

    // Complete editing and save final outputs
    async completeEditing(assignmentId, userId, editedFields, outputs, timeSpent, qualityScores) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE assignments
                SET status = 'reviewed',
                    editing_completed_at = CURRENT_TIMESTAMP,
                    editing_completed_by = ?,
                    edited_fields = ?,
                    editing_time_seconds = ?,
                    final_html = ?,
                    final_text = ?,
                    final_jsonld = ?,
                    tracked_changes_html = ?,
                    cms_bridge_json = ?,
                    quality_score = ?,
                    ap_style_score = ?,
                    voice_consistency_score = ?,
                    grammar_score = ?
                WHERE id = ? AND status = 'editing'
            `;

            this.db.run(sql, [
                userId,
                JSON.stringify(editedFields),
                timeSpent,
                outputs.html,
                outputs.text,
                outputs.jsonld,
                outputs.trackedChanges,
                outputs.cmsBridge,
                qualityScores.overall,
                qualityScores.apStyle,
                qualityScores.voice,
                qualityScores.grammar,
                assignmentId
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`✅ Editing completed on assignment ${assignmentId}`);

                    // Create edited version snapshot
                    const versionSql = `
                        INSERT INTO assignment_versions (
                            assignment_id, version_type, version_number,
                            created_by, fields_json, html_snapshot
                        ) VALUES (?, 'edited', 1, ?, ?, ?)
                    `;

                    this.db.run(versionSql, [
                        assignmentId,
                        userId,
                        JSON.stringify(editedFields),
                        outputs.html
                    ]);

                    resolve();
                }
            }.bind(this));
        });
    }

    // Get assignment details
    async getAssignment(assignmentId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM assignments WHERE id = ?';
            this.db.get(sql, [assignmentId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Get assignment by slug
    async getAssignmentBySlug(slug) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM assignments WHERE slug = ?';
            this.db.get(sql, [slug], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Get assignment history
    async getAssignmentHistory(assignmentId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM assignment_history
                WHERE assignment_id = ?
                ORDER BY changed_at DESC
            `;
            this.db.all(sql, [assignmentId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get assignment versions
    async getAssignmentVersions(assignmentId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM assignment_versions
                WHERE assignment_id = ?
                ORDER BY created_at ASC
            `;
            this.db.all(sql, [assignmentId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Record parser feedback
    async recordParserFeedback(assignmentId, userId, feedback) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO parser_feedback (
                    assignment_id, submitted_by, field_name,
                    parser_extracted, user_corrected, correction_type,
                    pattern_signals
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                assignmentId,
                userId,
                feedback.fieldName,
                feedback.parserExtracted,
                feedback.userCorrected,
                feedback.correctionType,
                JSON.stringify(feedback.patternSignals || {})
            ], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    // Record editorial change
    async recordEditorialChange(assignmentId, userId, change) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO editorial_changes (
                    assignment_id, changed_by, field_name,
                    original_value, edited_value, change_type,
                    category, ai_recommendation_accepted, quality_improvement
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                assignmentId,
                userId,
                change.fieldName,
                change.originalValue,
                change.editedValue,
                change.changeType,
                change.category,
                change.aiRecommendationAccepted ? 1 : 0,
                change.qualityImprovement || null
            ], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    // Utility: Generate slug from title
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50) + '-' + Date.now();
    }

    // Get statistics
    async getStatistics() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ('needs_validation', 'validating') THEN 1 ELSE 0 END) as needs_validation,
                    SUM(CASE WHEN status IN ('validated', 'editing') THEN 1 ELSE 0 END) as needs_editing,
                    SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
                    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                    AVG(validation_time_seconds) as avg_validation_time,
                    AVG(editing_time_seconds) as avg_editing_time,
                    AVG(quality_score) as avg_quality_score
                FROM assignments
            `;

            this.db.get(sql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Close database
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) console.error('Error closing assignments database:', err);
                else console.log('📊 Assignments database closed');
            });
        }
    }
}

module.exports = AssignmentsManager;
