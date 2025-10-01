const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class AppSettingsManager {
    constructor(dbPath = './data/app-settings.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.cachedParserSettings = null;
        this.cachedEditorSettings = null;
        this.cachedEditChecks = null;
    }

    // Initialize database and create tables
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening app settings database:', err);
                    reject(err);
                    return;
                }

                console.log('⚙️  App settings database connected');

                // Read and execute schema
                const schemaPath = path.join(__dirname, 'app-settings-schema.sql');
                const schema = fs.readFileSync(schemaPath, 'utf8');

                this.db.exec(schema, (err) => {
                    if (err) {
                        console.error('Error creating app settings schema:', err);
                        reject(err);
                    } else {
                        console.log('✅ App settings schema initialized');
                        resolve();
                    }
                });
            });
        });
    }

    // === PARSER SETTINGS ===

    async getParserSettings() {
        if (this.cachedParserSettings) {
            return this.cachedParserSettings;
        }

        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM parser_settings WHERE id = 1';

            this.db.get(sql, [], (err, row) => {
                if (err) reject(err);
                else {
                    this.cachedParserSettings = row;
                    resolve(row);
                }
            });
        });
    }

    async updateParserSettings(settings) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(settings).filter(k => k !== 'id');
            const placeholders = fields.map(() => '?').join(', ');
            const updates = fields.map(f => `${f} = ?`).join(', ');

            const sql = `UPDATE parser_settings SET ${updates} WHERE id = 1`;
            const values = fields.map(f => settings[f]);

            this.db.run(sql, values, (err) => {
                if (err) reject(err);
                else {
                    this.cachedParserSettings = null;
                    console.log('✅ Parser settings updated');
                    resolve({ success: true });
                }
            });
        });
    }

    // === EDITOR SETTINGS ===

    async getEditorSettings() {
        if (this.cachedEditorSettings) {
            return this.cachedEditorSettings;
        }

        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM editor_settings WHERE id = 1';

            this.db.get(sql, [], (err, row) => {
                if (err) reject(err);
                else {
                    this.cachedEditorSettings = row;
                    resolve(row);
                }
            });
        });
    }

    async updateEditorSettings(settings) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(settings).filter(k => k !== 'id');
            const updates = fields.map(f => `${f} = ?`).join(', ');

            const sql = `UPDATE editor_settings SET ${updates} WHERE id = 1`;
            const values = fields.map(f => settings[f]);

            this.db.run(sql, values, (err) => {
                if (err) reject(err);
                else {
                    this.cachedEditorSettings = null;
                    console.log('✅ Editor settings updated');
                    resolve({ success: true });
                }
            });
        });
    }

    // === EDIT CHECK CONFIGURATIONS ===

    async getEditChecks(category = null) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM edit_check_config';
            const params = [];

            if (category) {
                sql += ' WHERE check_category = ?';
                params.push(category);
            }

            sql += ' ORDER BY check_category, check_name';

            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else {
                    rows.forEach(row => {
                        if (row.examples) {
                            row.examples = JSON.parse(row.examples);
                        }
                    });
                    resolve(rows);
                }
            });
        });
    }

    async updateEditCheck(checkName, updates) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates);
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const values = [...fields.map(f => updates[f]), checkName];

            const sql = `UPDATE edit_check_config SET ${setClause} WHERE check_name = ?`;

            this.db.run(sql, values, (err) => {
                if (err) reject(err);
                else {
                    this.cachedEditChecks = null;
                    resolve({ success: true });
                }
            });
        });
    }

    async toggleEditCheck(checkName, enabled) {
        return this.updateEditCheck(checkName, { enabled: enabled ? 1 : 0 });
    }

    async bulkToggleEditChecks(category, enabled) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE edit_check_config SET enabled = ? WHERE check_category = ?';

            this.db.run(sql, [enabled ? 1 : 0, category], (err) => {
                if (err) reject(err);
                else {
                    this.cachedEditChecks = null;
                    console.log(`✅ ${category} checks ${enabled ? 'enabled' : 'disabled'}`);
                    resolve({ success: true });
                }
            });
        });
    }

    // === PARSER FIELD CONFIGURATIONS ===

    async getParserFields() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM parser_field_config WHERE enabled = 1 ORDER BY field_name';

            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else {
                    rows.forEach(row => {
                        if (row.validation_rules) {
                            row.validation_rules = JSON.parse(row.validation_rules);
                        }
                    });
                    resolve(rows);
                }
            });
        });
    }

    async updateParserField(fieldName, updates) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updates);
            const setClause = fields.map(f => `${f} = ?`).join(', ');
            const values = [...fields.map(f => updates[f]), fieldName];

            const sql = `UPDATE parser_field_config SET ${setClause} WHERE field_name = ?`;

            this.db.run(sql, values, (err) => {
                if (err) reject(err);
                else resolve({ success: true });
            });
        });
    }

    // === UTILITY METHODS ===

    async getEnabledEditChecks() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM edit_check_config WHERE enabled = 1 ORDER BY check_category, check_name';

            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getEditChecksByCategory() {
        const checks = await this.getEditChecks();
        const byCategory = {};

        checks.forEach(check => {
            if (!byCategory[check.check_category]) {
                byCategory[check.check_category] = [];
            }
            byCategory[check.check_category].push(check);
        });

        return byCategory;
    }

    async isEditCheckEnabled(checkName) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT enabled FROM edit_check_config WHERE check_name = ?';

            this.db.get(sql, [checkName], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.enabled === 1 : false);
            });
        });
    }

    async getParserSettingsSummary() {
        const settings = await this.getParserSettings();
        const enabled = [];

        if (settings.auto_extract_context) enabled.push('Auto Context');
        if (settings.extract_quotes) enabled.push('Quotes');
        if (settings.extract_contact_info) enabled.push('Contacts');
        if (settings.auto_detect_boilerplate) enabled.push('Boilerplate');

        return enabled.length > 0 ? enabled.join(', ') : 'Basic parsing';
    }

    async getEditorSettingsSummary() {
        const settings = await this.getEditorSettings();
        const enabledCount = await this.getEnabledEditChecks();

        return `${settings.ai_assistance_level} assistance, ${enabledCount.length} checks enabled`;
    }

    // Close database
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) console.error('Error closing app settings database:', err);
                else console.log('⚙️  App settings database closed');
            });
        }
    }
}

module.exports = AppSettingsManager;
