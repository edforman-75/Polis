const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class CampaignSettingsManager {
    constructor(dbPath = './data/campaign-settings.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.cachedSettings = null;
    }

    // Initialize database and create tables
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening campaign settings database:', err);
                    reject(err);
                    return;
                }

                console.log('⚙️  Campaign settings database connected');

                // Read and execute schema
                const schemaPath = path.join(__dirname, 'campaign-settings-schema.sql');
                const schema = fs.readFileSync(schemaPath, 'utf8');

                this.db.exec(schema, (err) => {
                    if (err) {
                        console.error('Error creating campaign settings schema:', err);
                        reject(err);
                    } else {
                        console.log('✅ Campaign settings schema initialized');
                        resolve();
                    }
                });
            });
        });
    }

    // Get campaign settings (cached)
    async getSettings() {
        if (this.cachedSettings) {
            return this.cachedSettings;
        }

        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM campaign_settings WHERE id = 1';

            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    this.cachedSettings = row;
                    resolve(row);
                } else {
                    // No settings found, return default
                    resolve({
                        id: 1,
                        candidate_name: 'Not Configured',
                        organization_name: 'Not Configured',
                        configured: false
                    });
                }
            });
        });
    }

    // Update campaign settings
    async updateSettings(settings) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO campaign_settings (
                    id,
                    candidate_name,
                    candidate_first_name,
                    candidate_last_name,
                    candidate_title,
                    candidate_pronouns,
                    organization_name,
                    organization_legal_name,
                    office_sought,
                    district,
                    party_affiliation,
                    election_date,
                    election_type,
                    campaign_tagline,
                    primary_issues,
                    voice_profile,
                    tone_guidelines,
                    ap_style_strict,
                    press_contact_name,
                    press_contact_title,
                    press_contact_email,
                    press_contact_phone,
                    campaign_website,
                    twitter_handle,
                    facebook_handle,
                    instagram_handle,
                    boilerplate_short,
                    boilerplate_long,
                    auto_extract_context,
                    default_release_type,
                    preferred_quote_style,
                    include_call_to_action,
                    default_cta_text,
                    last_modified_by
                ) VALUES (
                    1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            `;

            this.db.run(sql, [
                settings.candidate_name,
                settings.candidate_first_name || null,
                settings.candidate_last_name || null,
                settings.candidate_title || null,
                settings.candidate_pronouns || null,
                settings.organization_name,
                settings.organization_legal_name || null,
                settings.office_sought || null,
                settings.district || null,
                settings.party_affiliation || null,
                settings.election_date || null,
                settings.election_type || null,
                settings.campaign_tagline || null,
                settings.primary_issues || null,
                settings.voice_profile || 'professional',
                settings.tone_guidelines || null,
                settings.ap_style_strict !== undefined ? settings.ap_style_strict : 1,
                settings.press_contact_name || null,
                settings.press_contact_title || null,
                settings.press_contact_email || null,
                settings.press_contact_phone || null,
                settings.campaign_website || null,
                settings.twitter_handle || null,
                settings.facebook_handle || null,
                settings.instagram_handle || null,
                settings.boilerplate_short || null,
                settings.boilerplate_long || null,
                settings.auto_extract_context !== undefined ? settings.auto_extract_context : 0,
                settings.default_release_type || 'general',
                settings.preferred_quote_style || 'conversational',
                settings.include_call_to_action !== undefined ? settings.include_call_to_action : 1,
                settings.default_cta_text || null,
                settings.last_modified_by || 'system'
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Campaign settings updated');
                    // Clear cache
                    this.cachedSettings = null;
                    resolve({ success: true });
                }
            }.bind(this));
        });
    }

    // Check if campaign is configured
    async isConfigured() {
        const settings = await this.getSettings();
        return settings.candidate_name !== 'Not Configured';
    }

    // Get context for parser (formatted for context extractor)
    async getParserContext() {
        const settings = await this.getSettings();

        return {
            candidate_name: settings.candidate_name,
            candidate_title: settings.candidate_title,
            organization: settings.organization_name,
            office_sought: settings.office_sought,
            party: settings.party_affiliation,
            race_context: settings.district ? `${settings.office_sought} in ${settings.district}` : settings.office_sought,
            voice_profile: settings.voice_profile,
            tone_guidelines: settings.tone_guidelines,
            boilerplate: settings.boilerplate_short || settings.boilerplate_long,
            confidence: {
                overall: 1.0 // Settings are 100% confident
            }
        };
    }

    // Add team member
    async addTeamMember(member) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO campaign_team (
                    user_id, user_name, user_email, role, permissions
                ) VALUES (?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [
                member.user_id,
                member.user_name,
                member.user_email || null,
                member.role,
                JSON.stringify(member.permissions || [])
            ], function(err) {
                if (err) reject(err);
                else {
                    console.log(`✅ Team member added: ${member.user_name} (${member.role})`);
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    // Get team members
    async getTeamMembers() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM campaign_team WHERE active = 1 ORDER BY user_name';

            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else {
                    rows.forEach(row => {
                        if (row.permissions) {
                            row.permissions = JSON.parse(row.permissions);
                        }
                    });
                    resolve(rows);
                }
            });
        });
    }

    // Add style guide rule
    async addStyleRule(rule) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO campaign_style_guide (
                    rule_type, rule_name, rule_description, examples
                ) VALUES (?, ?, ?, ?)
            `;

            this.db.run(sql, [
                rule.rule_type,
                rule.rule_name,
                rule.rule_description || null,
                JSON.stringify(rule.examples || [])
            ], function(err) {
                if (err) reject(err);
                else {
                    console.log(`✅ Style rule added: ${rule.rule_name}`);
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    // Get style guide rules
    async getStyleRules(ruleType = null) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM campaign_style_guide WHERE active = 1';
            const params = [];

            if (ruleType) {
                sql += ' AND rule_type = ?';
                params.push(ruleType);
            }

            sql += ' ORDER BY rule_type, rule_name';

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

    // Generate settings summary for display
    async getSettingsSummary() {
        const settings = await this.getSettings();

        if (!await this.isConfigured()) {
            return 'Campaign not configured';
        }

        const parts = [
            settings.candidate_name,
            settings.office_sought ? `for ${settings.office_sought}` : null,
            settings.district ? `(${settings.district})` : null,
            settings.party_affiliation ? `- ${settings.party_affiliation}` : null
        ].filter(Boolean);

        return parts.join(' ');
    }

    // Close database
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) console.error('Error closing campaign settings database:', err);
                else console.log('⚙️  Campaign settings database closed');
            });
        }
    }
}

module.exports = CampaignSettingsManager;
