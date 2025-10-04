const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            const dbPath = process.env.DATABASE_PATH || './campaign.db';

            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('📂 Connected to SQLite database');
                    this.createTables()
                        .then(() => this.seedData())
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    async createTables() {
        const queries = [
            // Users table with enhanced role support
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT DEFAULT 'writer',
                department TEXT,
                supervisor_id INTEGER,
                security_clearance TEXT DEFAULT 'internal',
                access_restrictions TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                last_password_change DATETIME DEFAULT CURRENT_TIMESTAMP,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                FOREIGN KEY (supervisor_id) REFERENCES users(id)
            )`,

            // Assignments table
            `CREATE TABLE IF NOT EXISTS assignments (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                brief TEXT,
                assignor_id INTEGER,
                assignee_id INTEGER,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'medium',
                due_date DATETIME,
                assignment_type TEXT DEFAULT 'press-release',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                feedback TEXT,
                revision_type TEXT,
                returned_by INTEGER,
                returned_at DATETIME,
                clarification_request TEXT,
                clarification_requested_by INTEGER,
                clarification_requested_at DATETIME,
                clarification_response TEXT,
                clarification_provided_by INTEGER,
                clarification_provided_at DATETIME,
                specific_questions TEXT,
                notes TEXT,
                FOREIGN KEY (assignor_id) REFERENCES users(id),
                FOREIGN KEY (assignee_id) REFERENCES users(id),
                FOREIGN KEY (returned_by) REFERENCES users(id),
                FOREIGN KEY (clarification_requested_by) REFERENCES users(id),
                FOREIGN KEY (clarification_provided_by) REFERENCES users(id)
            )`,

            // Content blocks table
            `CREATE TABLE IF NOT EXISTS content_blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id TEXT,
                block_id TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT,
                data TEXT,
                position INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id)
            )`,

            // Content versions table (for tracking edits)
            `CREATE TABLE IF NOT EXISTS content_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id TEXT,
                user_id INTEGER,
                version_data TEXT,
                message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // Research queries table (for tracking AI usage)
            `CREATE TABLE IF NOT EXISTS research_queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                assignment_id TEXT,
                query TEXT NOT NULL,
                response TEXT,
                topic TEXT,
                sources TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (assignment_id) REFERENCES assignments(id)
            )`,

            // Workflows table
            `CREATE TABLE IF NOT EXISTS workflows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id TEXT,
                from_status TEXT,
                to_status TEXT,
                user_id INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // Schema exports table
            `CREATE TABLE IF NOT EXISTS schema_exports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id TEXT,
                schema_data TEXT NOT NULL,
                platform TEXT,
                exported_by INTEGER,
                exported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (exported_by) REFERENCES users(id)
            )`,

            // Templates table
            `CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Speeches table
            `CREATE TABLE IF NOT EXISTS speeches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Speech versions table (for revision history)
            `CREATE TABLE IF NOT EXISTS speech_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                speech_id INTEGER,
                version_number INTEGER,
                content TEXT NOT NULL,
                metadata TEXT,
                changes_summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (speech_id) REFERENCES speeches(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Communications briefs table
            `CREATE TABLE IF NOT EXISTS communications_briefs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                audience TEXT,
                tone TEXT,
                key_points TEXT,
                assignment_id TEXT,
                status TEXT DEFAULT 'draft',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                assigned_to INTEGER,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (assigned_to) REFERENCES users(id)
            )`,

            // Social media posts table
            `CREATE TABLE IF NOT EXISTS social_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                content TEXT NOT NULL,
                media_urls TEXT,
                hashtags TEXT,
                scheduled_for DATETIME,
                status TEXT DEFAULT 'draft',
                engagement_data TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Policy documents table
            `CREATE TABLE IF NOT EXISTS policy_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                key_points TEXT,
                status TEXT DEFAULT 'draft',
                version INTEGER DEFAULT 1,
                metadata TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                reviewed_by INTEGER,
                approved_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (reviewed_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )`,

            // Press releases table
            `CREATE TABLE IF NOT EXISTS press_releases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                headline TEXT NOT NULL,
                subheadline TEXT,
                content TEXT NOT NULL,
                media_contact TEXT,
                embargo_date DATETIME,
                distribution_list TEXT,
                status TEXT DEFAULT 'draft',
                metadata TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                approved_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )`,

            // Event content table
            `CREATE TABLE IF NOT EXISTS event_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_name TEXT NOT NULL,
                event_type TEXT NOT NULL,
                date DATETIME NOT NULL,
                location TEXT,
                description TEXT,
                talking_points TEXT,
                logistics TEXT,
                media_advisory TEXT,
                status TEXT DEFAULT 'planned',
                assignment_id TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Campaign materials table
            `CREATE TABLE IF NOT EXISTS campaign_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT,
                design_notes TEXT,
                target_audience TEXT,
                distribution_channels TEXT,
                budget_allocated DECIMAL(10,2),
                status TEXT DEFAULT 'concept',
                metadata TEXT,
                assignment_id TEXT,
                created_by INTEGER,
                approved_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )`,

            // Opposition research table
            `CREATE TABLE IF NOT EXISTS opposition_research (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject TEXT NOT NULL,
                category TEXT NOT NULL,
                content TEXT NOT NULL,
                sources TEXT,
                verification_status TEXT DEFAULT 'unverified',
                sensitivity_level TEXT DEFAULT 'internal',
                tags TEXT,
                notes TEXT,
                assignment_id TEXT,
                researched_by INTEGER,
                verified_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (researched_by) REFERENCES users(id),
                FOREIGN KEY (verified_by) REFERENCES users(id)
            )`,

            // Voter outreach table
            `CREATE TABLE IF NOT EXISTS voter_outreach (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_name TEXT NOT NULL,
                target_demographics TEXT,
                message TEXT NOT NULL,
                channels TEXT,
                geographic_focus TEXT,
                budget DECIMAL(10,2),
                start_date DATE,
                end_date DATE,
                metrics TEXT,
                status TEXT DEFAULT 'planning',
                assignment_id TEXT,
                created_by INTEGER,
                managed_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (managed_by) REFERENCES users(id)
            )`,

            // Media relations table
            `CREATE TABLE IF NOT EXISTS media_relations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                outlet_name TEXT NOT NULL,
                contact_name TEXT,
                contact_email TEXT,
                contact_phone TEXT,
                beat TEXT,
                relationship_notes TEXT,
                last_contact DATE,
                priority_level TEXT DEFAULT 'medium',
                assignment_id TEXT,
                managed_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (managed_by) REFERENCES users(id)
            )`,

            // Editor operations table (for undo/redo functionality)
            `CREATE TABLE IF NOT EXISTS editor_operations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                assignment_id TEXT,
                content_type TEXT,
                content_id TEXT,
                operation_type TEXT NOT NULL,
                operation_data TEXT NOT NULL,
                position_start INTEGER,
                position_end INTEGER,
                content_before TEXT,
                content_after TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER,
                is_undone BOOLEAN DEFAULT FALSE,
                is_checkpoint BOOLEAN DEFAULT FALSE,
                sequence_number INTEGER,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // Editor sessions table (for collaborative editing)
            `CREATE TABLE IF NOT EXISTS editor_sessions (
                id TEXT PRIMARY KEY,
                assignment_id TEXT,
                content_type TEXT,
                content_id TEXT,
                user_id INTEGER,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active',
                cursor_position INTEGER DEFAULT 0,
                selection_start INTEGER DEFAULT 0,
                selection_end INTEGER DEFAULT 0,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // Fact-checking table
            `CREATE TABLE IF NOT EXISTS fact_checks (
                id TEXT PRIMARY KEY,
                assignment_id TEXT,
                source_assignment_id TEXT,
                content TEXT NOT NULL,
                claims_to_verify TEXT,
                verified_claims TEXT,
                disputed_claims TEXT,
                sources TEXT,
                overall_rating TEXT,
                status TEXT DEFAULT 'pending',
                assigned_to INTEGER,
                created_by INTEGER,
                completed_by INTEGER,
                fact_checker_notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (source_assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (assigned_to) REFERENCES users(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (completed_by) REFERENCES users(id)
            )`,

            // Extracted claims table - individual claims from fact-checked content
            `CREATE TABLE IF NOT EXISTS extracted_claims (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fact_check_id TEXT NOT NULL,
                claim_text TEXT NOT NULL,
                claim_type TEXT,
                sentence_index INTEGER,
                span_start INTEGER,
                span_end INTEGER,
                verifiable BOOLEAN DEFAULT 1,
                verification_type TEXT,
                confidence_score REAL,
                patterns_matched TEXT,
                deniability_score REAL,
                hearsay_confidence REAL,
                private_data_detected BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'pending',
                priority TEXT DEFAULT 'medium',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (fact_check_id) REFERENCES fact_checks(id) ON DELETE CASCADE
            )`,

            // Claim verifications table - verification attempts and results
            `CREATE TABLE IF NOT EXISTS claim_verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                claim_id INTEGER NOT NULL,
                verification_status TEXT DEFAULT 'pending',
                rating TEXT,
                credibility_score REAL,
                sources_found TEXT,
                verification_method TEXT,
                verification_notes TEXT,
                verified_by INTEGER,
                verified_at DATETIME,
                time_spent_seconds INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                -- Comparative claim specific fields
                comparison_type TEXT,
                left_value TEXT,
                right_value TEXT,
                calculated_result TEXT,
                expected_result TEXT,
                search_queries_used TEXT,
                data_extraction_log TEXT,
                calculation_steps TEXT,
                automated BOOLEAN DEFAULT 0,

                -- Structured claim fields (for fact-check pipeline)
                predicate TEXT,
                actor TEXT,
                action TEXT,
                object TEXT,
                quantity_value REAL,
                quantity_unit TEXT,
                quantity_direction TEXT,
                time_reference TEXT,
                time_start TEXT,
                time_end TEXT,
                assertiveness REAL,

                FOREIGN KEY (claim_id) REFERENCES extracted_claims(id) ON DELETE CASCADE,
                FOREIGN KEY (verified_by) REFERENCES users(id)
            )`,

            // Verification sources table - sources used for verification
            `CREATE TABLE IF NOT EXISTS verification_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                verification_id INTEGER NOT NULL,
                url TEXT NOT NULL,
                domain TEXT,
                title TEXT,
                credibility_tier TEXT,
                credibility_score REAL,
                supports_claim BOOLEAN,
                relevance_score REAL,
                excerpt TEXT,
                date_published DATETIME,
                date_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (verification_id) REFERENCES claim_verifications(id) ON DELETE CASCADE
            )`,

            // Claim types reference table
            `CREATE TABLE IF NOT EXISTS claim_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type_name TEXT UNIQUE NOT NULL,
                verification_approach TEXT NOT NULL,
                description TEXT,
                requires_sources BOOLEAN DEFAULT 1,
                typical_verification_time INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Non-factual statements table - tracks statements that appear factual but cannot be fact-checked
            `CREATE TABLE IF NOT EXISTS non_factual_statements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fact_check_id TEXT,
                statement_text TEXT NOT NULL,
                reason_category TEXT NOT NULL,
                detailed_explanation TEXT NOT NULL,
                source_file TEXT,
                source_context TEXT,
                sentence_index INTEGER,
                appears_factual_confidence REAL,
                keywords_detected TEXT,
                examples TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (fact_check_id) REFERENCES fact_checks(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Non-factual categories reference table - defines why statements can't be fact-checked
            `CREATE TABLE IF NOT EXISTS non_factual_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_name TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                detection_keywords TEXT,
                example_patterns TEXT,
                explanation_template TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Research tracking table
            `CREATE TABLE IF NOT EXISTS research_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id TEXT,
                user_id INTEGER,
                status TEXT,
                milestone TEXT,
                notes TEXT,
                time_estimate INTEGER,
                resources_needed TEXT,
                logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // Access control tables

            // Role permissions table
            `CREATE TABLE IF NOT EXISTS role_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                permission TEXT NOT NULL,
                granted_by INTEGER,
                granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (granted_by) REFERENCES users(id),
                UNIQUE(role, permission)
            )`,

            // User permissions table (for individual overrides)
            `CREATE TABLE IF NOT EXISTS user_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                permission TEXT NOT NULL,
                granted_by INTEGER,
                granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (granted_by) REFERENCES users(id),
                UNIQUE(user_id, permission)
            )`,

            // Resource access table (for specific resource permissions)
            `CREATE TABLE IF NOT EXISTS resource_access (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                permission_type TEXT NOT NULL,
                granted_by INTEGER,
                granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (granted_by) REFERENCES users(id)
            )`,

            // Access logs table
            `CREATE TABLE IF NOT EXISTS access_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                resource_type TEXT,
                resource_id TEXT,
                ip_address TEXT,
                user_agent TEXT,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

            // Team memberships table
            `CREATE TABLE IF NOT EXISTS team_memberships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                team_name TEXT NOT NULL,
                role_in_team TEXT DEFAULT 'member',
                added_by INTEGER,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (added_by) REFERENCES users(id)
            )`,

            // Content sensitivity table
            `CREATE TABLE IF NOT EXISTS content_sensitivity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                sensitivity_level TEXT DEFAULT 'internal',
                classification_reason TEXT,
                classified_by INTEGER,
                classified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                review_date DATETIME,
                FOREIGN KEY (classified_by) REFERENCES users(id)
            )`,

            // Editorial Comment System
            `CREATE TABLE IF NOT EXISTS editorial_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                parent_comment_id INTEGER,
                user_id INTEGER NOT NULL,
                comment_text TEXT NOT NULL,
                comment_type TEXT DEFAULT 'general',
                selection_start INTEGER,
                selection_end INTEGER,
                selected_text TEXT,
                status TEXT DEFAULT 'active',
                priority TEXT DEFAULT 'normal',
                resolved_at DATETIME,
                resolved_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_comment_id) REFERENCES editorial_comments(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (resolved_by) REFERENCES users(id)
            )`,

            // Comment reactions/votes
            `CREATE TABLE IF NOT EXISTS comment_reactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                comment_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                reaction_type TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (comment_id) REFERENCES editorial_comments(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(comment_id, user_id, reaction_type)
            )`,

            // Editorial review history
            `CREATE TABLE IF NOT EXISTS editorial_reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                reviewer_id INTEGER NOT NULL,
                review_stage TEXT NOT NULL,
                review_status TEXT NOT NULL,
                review_notes TEXT,
                issues_found INTEGER DEFAULT 0,
                time_spent_minutes INTEGER,
                next_reviewer_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (reviewer_id) REFERENCES users(id),
                FOREIGN KEY (next_reviewer_id) REFERENCES users(id)
            )`,

            // Style and grammar check results
            `CREATE TABLE IF NOT EXISTS style_check_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                check_type TEXT NOT NULL,
                overall_score INTEGER,
                violations_count INTEGER DEFAULT 0,
                suggestions_count INTEGER DEFAULT 0,
                detailed_results TEXT,
                checked_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (checked_by) REFERENCES users(id)
            )`,

            // Manual references table - editor-provided references for claims
            `CREATE TABLE IF NOT EXISTS manual_references (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                claim_id INTEGER NOT NULL,
                url TEXT NOT NULL,
                title TEXT,
                description TEXT,
                added_by INTEGER NOT NULL,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                validated BOOLEAN DEFAULT 0,
                validation_status TEXT DEFAULT 'pending',
                http_status_code INTEGER,
                validation_error TEXT,
                validation_attempted_at DATETIME,
                FOREIGN KEY (claim_id) REFERENCES extracted_claims(id) ON DELETE CASCADE,
                FOREIGN KEY (added_by) REFERENCES users(id)
            )`,

            // Boilerplate library - stores known boilerplate paragraphs
            `CREATE TABLE IF NOT EXISTS boilerplate_library (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_name TEXT NOT NULL,
                campaign_id TEXT,
                boilerplate_text TEXT NOT NULL,
                boilerplate_hash TEXT NOT NULL UNIQUE,
                is_active BOOLEAN DEFAULT 1,
                first_seen_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                usage_count INTEGER DEFAULT 1,
                first_seen_in_release TEXT,
                boilerplate_type TEXT DEFAULT 'campaign',
                confidence_score REAL DEFAULT 1.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Boilerplate indexes
            `CREATE INDEX IF NOT EXISTS idx_boilerplate_candidate ON boilerplate_library(candidate_name)`,
            `CREATE INDEX IF NOT EXISTS idx_boilerplate_hash ON boilerplate_library(boilerplate_hash)`,
            `CREATE INDEX IF NOT EXISTS idx_boilerplate_active ON boilerplate_library(is_active)`,

            // Boilerplate usage tracking
            `CREATE TABLE IF NOT EXISTS boilerplate_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                boilerplate_id INTEGER NOT NULL,
                assignment_id INTEGER,
                was_modified BOOLEAN DEFAULT 0,
                original_text TEXT,
                modified_text TEXT,
                modification_type TEXT,
                similarity_score REAL,
                modified_by TEXT,
                modification_notes TEXT,
                used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (boilerplate_id) REFERENCES boilerplate_library(id) ON DELETE CASCADE
            )`,

            `CREATE INDEX IF NOT EXISTS idx_boilerplate_usage_assignment ON boilerplate_usage(assignment_id)`,
            `CREATE INDEX IF NOT EXISTS idx_boilerplate_usage_modified ON boilerplate_usage(was_modified)`,

            // Boilerplate modification warnings
            `CREATE TABLE IF NOT EXISTS boilerplate_warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id INTEGER,
                boilerplate_id INTEGER,
                warning_type TEXT NOT NULL,
                warning_severity TEXT DEFAULT 'medium',
                original_text TEXT,
                attempted_change TEXT,
                editor_user TEXT,
                editor_acknowledged BOOLEAN DEFAULT 0,
                acknowledged_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (boilerplate_id) REFERENCES boilerplate_library(id) ON DELETE CASCADE
            )`,

            `CREATE INDEX IF NOT EXISTS idx_boilerplate_warnings_assignment ON boilerplate_warnings(assignment_id)`
        ];

        for (const query of queries) {
            await this.run(query);
        }

        // Migration: Add assignment_type column if it doesn't exist
        const hasAssignmentType = await this.columnExists('assignments', 'assignment_type');
        if (!hasAssignmentType) {
            await this.run(`ALTER TABLE assignments ADD COLUMN assignment_type TEXT DEFAULT 'press-release'`);
            console.log('📊 Added assignment_type column to assignments table');
        }

        // Migration: Add research workflow columns to assignments table
        const workflowColumns = [
            { name: 'completed_at', type: 'DATETIME', default: null },
            { name: 'feedback', type: 'TEXT', default: null },
            { name: 'revision_type', type: 'TEXT', default: null },
            { name: 'returned_by', type: 'INTEGER', default: null },
            { name: 'returned_at', type: 'DATETIME', default: null },
            { name: 'clarification_request', type: 'TEXT', default: null },
            { name: 'clarification_requested_by', type: 'INTEGER', default: null },
            { name: 'clarification_requested_at', type: 'DATETIME', default: null },
            { name: 'clarification_response', type: 'TEXT', default: null },
            { name: 'clarification_provided_by', type: 'INTEGER', default: null },
            { name: 'clarification_provided_at', type: 'DATETIME', default: null },
            { name: 'specific_questions', type: 'TEXT', default: null },
            { name: 'notes', type: 'TEXT', default: null }
        ];

        for (const column of workflowColumns) {
            const hasColumn = await this.columnExists('assignments', column.name);
            if (!hasColumn) {
                const defaultClause = column.default ? ` DEFAULT ${column.default}` : '';
                await this.run(`ALTER TABLE assignments ADD COLUMN ${column.name} ${column.type}${defaultClause}`);
                console.log(`🔄 Added ${column.name} column to assignments table`);
            }
        }

        // Migration: Add verification_notes column to opposition_research table
        const hasVerificationNotes = await this.columnExists('opposition_research', 'verification_notes');
        if (!hasVerificationNotes) {
            await this.run(`ALTER TABLE opposition_research ADD COLUMN verification_notes TEXT`);
            console.log('🔍 Added verification_notes column to opposition_research table');
        }

        // Migration: Add structured_data (LD-JSON) columns to all content tables
        const contentTables = [
            'speeches', 'social_posts', 'press_releases', 'policy_documents',
            'event_content', 'campaign_materials', 'opposition_research',
            'voter_outreach', 'media_relations', 'communications_briefs'
        ];

        for (const table of contentTables) {
            const hasStructuredData = await this.columnExists(table, 'structured_data');
            if (!hasStructuredData) {
                await this.run(`ALTER TABLE ${table} ADD COLUMN structured_data TEXT`);
                console.log(`📋 Added structured_data (LD-JSON) column to ${table} table`);
            }
        }

        // Migration: Add enhanced user table columns
        const userColumns = [
            { name: 'department', type: 'TEXT', default: null },
            { name: 'supervisor_id', type: 'INTEGER', default: null },
            { name: 'security_clearance', type: 'TEXT', default: "'internal'" },
            { name: 'access_restrictions', type: 'TEXT', default: null },
            { name: 'is_active', type: 'BOOLEAN', default: 'TRUE' },
            { name: 'last_password_change', type: 'DATETIME', default: null },
            { name: 'failed_login_attempts', type: 'INTEGER', default: '0' },
            { name: 'locked_until', type: 'DATETIME', default: null },
            { name: 'updated_at', type: 'DATETIME', default: null }
        ];

        for (const column of userColumns) {
            const hasColumn = await this.columnExists('users', column.name);
            if (!hasColumn) {
                const defaultClause = column.default ? ` DEFAULT ${column.default}` : '';
                await this.run(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}${defaultClause}`);
                console.log(`🔐 Added ${column.name} column to users table`);
            }
        }

        // Migration: Add team_members column to assignments and content tables
        const teamTables = ['assignments', ...contentTables];
        for (const table of teamTables) {
            const hasTeamMembers = await this.columnExists(table, 'team_members');
            if (!hasTeamMembers) {
                await this.run(`ALTER TABLE ${table} ADD COLUMN team_members TEXT`);
                console.log(`👥 Added team_members column to ${table} table`);
            }
        }

        // Migration: Add substantiation analysis columns to manual_references table
        const substantiationColumns = [
            { name: 'substantiation_status', type: 'TEXT', default: null },
            { name: 'substantiation_confidence', type: 'REAL', default: null },
            { name: 'substantiation_analysis', type: 'TEXT', default: null },
            { name: 'content_excerpt', type: 'TEXT', default: null }
        ];

        for (const col of substantiationColumns) {
            const hasColumn = await this.columnExists('manual_references', col.name);
            if (!hasColumn) {
                await this.run(`ALTER TABLE manual_references ADD COLUMN ${col.name} ${col.type}${col.default ? ' DEFAULT ' + col.default : ''}`);
                console.log(`📝 Added ${col.name} column to manual_references table`);
            }
        }

        console.log('✅ Database tables created');
    }

    async seedData() {
        // Check if data already exists
        const userCount = await this.get('SELECT COUNT(*) as count FROM users');
        if (userCount.count > 0) {
            console.log('📊 Database already seeded');
            return;
        }

        // Create demo users
        const hashedPassword = await bcrypt.hash('demo123', 10);

        // Senior Leadership Team
        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['admin@campaign.com', hashedPassword, 'System Admin', 'admin', 'Technology', 'top_secret', true]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['manager@campaign.com', hashedPassword, 'Sarah Rodriguez', 'campaign_manager', 'Leadership', 'top_secret', true]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['deputy@campaign.com', hashedPassword, 'Michael Chen', 'deputy_campaign_manager', 'Leadership', 'restricted', true, 2]
        );

        // Communications Leadership
        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['comms@campaign.com', hashedPassword, 'Jennifer Martinez', 'communications_director', 'Communications', 'restricted', true, 2]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['deputy-comms@campaign.com', hashedPassword, 'David Park', 'deputy_communications_director', 'Communications', 'confidential', true, 4]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['press@campaign.com', hashedPassword, 'Amanda Thompson', 'press_secretary', 'Communications', 'confidential', true, 4]
        );

        // Content Creation Team
        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['senior-writer@campaign.com', hashedPassword, 'Robert Kim', 'senior_writer', 'Communications', 'confidential', true, 4]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['writer1@campaign.com', hashedPassword, 'Alex Johnson', 'writer', 'Communications', 'internal', true, 4]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['writer2@campaign.com', hashedPassword, 'Emily Davis', 'writer', 'Communications', 'internal', true, 4]
        );

        // Research Team
        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['research@campaign.com', hashedPassword, 'Dr. James Wilson', 'research_director', 'Research', 'restricted', true, 2]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['researcher@campaign.com', hashedPassword, 'Lisa Zhang', 'researcher', 'Research', 'confidential', true, 10]
        );

        // Digital Team
        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['digital@campaign.com', hashedPassword, 'Carlos Rivera', 'digital_director', 'Digital', 'confidential', true, 2]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['social@campaign.com', hashedPassword, 'Maya Patel', 'digital_coordinator', 'Digital', 'internal', true, 12]
        );

        // Field Operations
        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['field@campaign.com', hashedPassword, 'Kevin O\'Connor', 'field_director', 'Field', 'confidential', true, 2]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['organizer@campaign.com', hashedPassword, 'Samantha Lee', 'field_organizer', 'Field', 'internal', true, 14]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['volunteer-coord@campaign.com', hashedPassword, 'Marcus Brown', 'volunteer_coordinator', 'Field', 'internal', true, 14]
        );

        // Finance Team
        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['finance@campaign.com', hashedPassword, 'Rachel Green', 'finance_director', 'Finance', 'restricted', true, 2]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['finance-coord@campaign.com', hashedPassword, 'Tony Garcia', 'finance_coordinator', 'Finance', 'confidential', true, 17]
        );

        // Support Staff
        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['assistant@campaign.com', hashedPassword, 'Jessica White', 'staff_assistant', 'Operations', 'internal', true, 3]
        );

        // Volunteers and Interns
        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, access_restrictions, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['volunteer1@campaign.com', hashedPassword, 'Tom Anderson', 'volunteer', 'Field', 'public', true, JSON.stringify({hours: '9-17', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']}), 16]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, access_restrictions, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['intern1@campaign.com', hashedPassword, 'Sophie Miller', 'intern', 'Communications', 'public', true, JSON.stringify({hours: '9-17', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], supervision_required: true}), 5]
        );

        await this.run(
            'INSERT INTO users (email, password, name, role, department, security_clearance, is_active, access_restrictions, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['intern2@campaign.com', hashedPassword, 'Jake Torres', 'intern', 'Research', 'public', true, JSON.stringify({hours: '9-17', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], supervision_required: true}), 10]
        );

        // Create demo assignments
        const assignments = [
            {
                id: 'A-2024-001',
                title: 'Healthcare Policy Statement',
                description: 'Draft statement on Medicare expansion proposal',
                brief: 'Create a comprehensive statement outlining our position on Medicare expansion...',
                status: 'in_progress',
                priority: 'high',
                due_date: '2024-11-15'
            },
            {
                id: 'A-2024-002',
                title: 'Veterans Day Op-Ed',
                description: 'Opinion piece for local newspaper',
                brief: 'Write a 600-word op-ed honoring veterans and outlining our veterans support policies...',
                status: 'review',
                priority: 'high',
                due_date: '2024-11-10'
            },
            {
                id: 'A-2024-003',
                title: 'Veterans Day Social Media Series',
                description: 'Multi-platform social media campaign for Veterans Day',
                brief: 'Develop a series of social media posts for Twitter, Facebook, and Instagram celebrating Veterans Day...',
                status: 'blocked',
                priority: 'urgent',
                due_date: '2024-11-11'
            },
            {
                id: 'A-2024-004',
                title: 'Economic Recovery Plan',
                description: 'Detailed policy brief on economic initiatives',
                brief: 'Prepare a policy brief outlining our economic recovery plan with focus on small business support...',
                status: 'pending',
                priority: 'medium',
                due_date: '2024-11-20'
            }
        ];

        for (const assignment of assignments) {
            await this.run(
                `INSERT INTO assignments (id, title, description, brief, assignor_id, assignee_id, status, priority, due_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [assignment.id, assignment.title, assignment.description, assignment.brief, 1, 2, assignment.status, assignment.priority, assignment.due_date]
            );
        }

        // Create demo templates
        await this.run(
            `INSERT INTO templates (name, type, content, created_by)
             VALUES (?, ?, ?, ?)`,
            ['Veterans Event Template', 'event', '{"blocks": [{"type": "heading1", "content": "Veterans Event"}, {"type": "event", "content": "Event details here"}]}', 1]
        );

        await this.run(
            `INSERT INTO templates (name, type, content, created_by)
             VALUES (?, ?, ?, ?)`,
            ['Policy Brief Template', 'policy', '{"blocks": [{"type": "heading1", "content": "Policy Brief"}, {"type": "policy", "content": "Policy details here"}]}', 1]
        );

        // Seed claim types
        await this.run(
            `INSERT INTO claim_types (type_name, verification_approach, description, requires_sources, typical_verification_time)
             VALUES (?, ?, ?, ?, ?)`,
            ['direct_factual', 'standard', 'Direct factual claims that can be verified against public sources', 1, 300]
        );

        await this.run(
            `INSERT INTO claim_types (type_name, verification_approach, description, requires_sources, typical_verification_time)
             VALUES (?, ?, ?, ?, ?)`,
            ['private_data', 'unverifiable', 'Claims based on private data not accessible to independent verification', 0, 60]
        );

        await this.run(
            `INSERT INTO claim_types (type_name, verification_approach, description, requires_sources, typical_verification_time)
             VALUES (?, ?, ?, ?, ?)`,
            ['hearsay', 'two-step', 'Reported speech requiring verification of both attribution and underlying claim', 1, 600]
        );

        await this.run(
            `INSERT INTO claim_types (type_name, verification_approach, description, requires_sources, typical_verification_time)
             VALUES (?, ?, ?, ?, ?)`,
            ['plausible_deniability', 'extract-underlying-claim', 'Claims made with deniability techniques that obscure direct assertion', 1, 450]
        );

        await this.run(
            `INSERT INTO claim_types (type_name, verification_approach, description, requires_sources, typical_verification_time)
             VALUES (?, ?, ?, ?, ?)`,
            ['comparative_computational', 'multi-step-comparative', 'Comparative claims requiring lookup of multiple metrics and calculation/comparison of values', 1, 900]
        );

        // Seed non-factual categories
        await this.run(
            `INSERT INTO non_factual_categories (category_name, description, detection_keywords, example_patterns, explanation_template)
             VALUES (?, ?, ?, ?, ?)`,
            [
                'opinion_characterization',
                'Subjective opinions and characterizations that cannot be objectively verified',
                JSON.stringify(['awful', 'terrible', 'great', 'excellent', 'failed', 'successful', 'dangerous', 'extreme', 'radical', 'bad', 'good']),
                JSON.stringify(['awful Republican tax bill', 'failed policies', 'dangerous rhetoric', 'extreme agenda']),
                'This is a subjective {adjective} that requires judgment and cannot be objectively verified. Different people have different definitions of "{term}" based on their values and perspectives.'
            ]
        );

        await this.run(
            `INSERT INTO non_factual_categories (category_name, description, detection_keywords, example_patterns, explanation_template)
             VALUES (?, ?, ?, ?, ?)`,
            [
                'prediction_future',
                'Predictions and speculation about future events that have not yet occurred',
                JSON.stringify(['will', 'may', 'threatens to', 'could', 'is going to', 'are at risk of', 'will lead to', 'may cause']),
                JSON.stringify(['will cost 15 million Americans their healthcare', 'threatens to undermine democracy', 'may lead to economic crisis']),
                'This is a prediction about the future using "{future_indicator}". Events that have not occurred cannot be verified. What CAN be verified is if authoritative sources (like CBO, expert analyses) have made such predictions.'
            ]
        );

        await this.run(
            `INSERT INTO non_factual_categories (category_name, description, detection_keywords, example_patterns, explanation_template)
             VALUES (?, ?, ?, ?, ?)`,
            [
                'motivation_intent',
                'Claims about internal mental states, motivations, or intentions that cannot be directly observed',
                JSON.stringify(['wants to', 'intends to', 'refuses to', 'cares about', 'doesn\'t care', 'trying to', 'attempting to', 'seeks to']),
                JSON.stringify(['Republicans want to hurt families', 'Democrats are fighting for working people', 'Trump refuses to negotiate']),
                'This claims to know someone\'s internal mental state ("{intent_verb}"). We cannot verify what someone wants, intends, or cares about - only their actions and statements can be verified.'
            ]
        );

        await this.run(
            `INSERT INTO non_factual_categories (category_name, description, detection_keywords, example_patterns, explanation_template)
             VALUES (?, ?, ?, ?, ?)`,
            [
                'value_judgment',
                'Normative claims about what should or must be done, moral judgments',
                JSON.stringify(['should', 'must', 'ought to', 'need to', 'wrong', 'right', 'unconscionable', 'shameful', 'disgraceful']),
                JSON.stringify(['This is wrong', 'They should be ashamed', 'We must act now', 'It\'s unconscionable']),
                'This is a normative/moral claim using "{normative_term}". Statements about what ought to be or moral judgments cannot be empirically verified - they depend on value systems and ethical frameworks.'
            ]
        );

        // Seed role permissions
        await this.seedRolePermissions();

        // Seed team memberships
        await this.seedTeamMemberships();

        console.log('🌱 Database seeded with demo data and permissions');
    }

    async seedRolePermissions() {
        const rolePermissions = [
            // Admin permissions
            { role: 'admin', permission: 'system.admin' },
            { role: 'admin', permission: 'users.create' },
            { role: 'admin', permission: 'users.update' },
            { role: 'admin', permission: 'users.delete' },

            // Campaign manager permissions
            { role: 'campaign_manager', permission: 'assignments.create' },
            { role: 'campaign_manager', permission: 'assignments.read.all' },
            { role: 'campaign_manager', permission: 'assignments.assign' },
            { role: 'campaign_manager', permission: 'content.publish' },

            // Communications director permissions
            { role: 'communications_director', permission: 'assignments.create' },
            { role: 'communications_director', permission: 'assignments.approve' },
            { role: 'communications_director', permission: 'press.approve' },
            { role: 'communications_director', permission: 'social.schedule' },

            // Senior writer permissions
            { role: 'senior_writer', permission: 'content.create' },
            { role: 'senior_writer', permission: 'speeches.create' },
            { role: 'senior_writer', permission: 'ai.use_advanced' },

            // Writer permissions
            { role: 'writer', permission: 'content.create' },
            { role: 'writer', permission: 'ai.use_basic' },
            { role: 'writer', permission: 'quality.run_checks' },

            // Reviewer permissions
            { role: 'reviewer', permission: 'content.read.assigned' },
            { role: 'reviewer', permission: 'quality.run_checks' },

            // Viewer permissions
            { role: 'viewer', permission: 'content.read.own' },

            // Volunteer permissions
            { role: 'volunteer', permission: 'content.read.own' },
            { role: 'volunteer', permission: 'templates.use' },

            // Intern permissions
            { role: 'intern', permission: 'content.read.own' }
        ];

        for (const rp of rolePermissions) {
            try {
                await this.run(
                    'INSERT OR IGNORE INTO role_permissions (role, permission, granted_by) VALUES (?, ?, ?)',
                    [rp.role, rp.permission, 1] // Admin grants initial permissions
                );
            } catch (error) {
                console.error('Error seeding role permission:', rp, error);
            }
        }

        console.log('🔐 Seeded role permissions');
    }

    async seedTeamMemberships() {
        const teamMemberships = [
            // Senior Leadership Team
            { user_id: 1, team_name: 'senior_leadership', role_in_team: 'admin', added_by: 1 },
            { user_id: 2, team_name: 'senior_leadership', role_in_team: 'campaign_manager', added_by: 1 },
            { user_id: 3, team_name: 'senior_leadership', role_in_team: 'deputy_manager', added_by: 1 },
            { user_id: 4, team_name: 'senior_leadership', role_in_team: 'communications_director', added_by: 2 },
            { user_id: 14, team_name: 'senior_leadership', role_in_team: 'field_director', added_by: 2 },
            { user_id: 17, team_name: 'senior_leadership', role_in_team: 'finance_director', added_by: 2 },

            // Communications Team - Editorial Workflow
            { user_id: 4, team_name: 'communications', role_in_team: 'director', added_by: 2 },
            { user_id: 5, team_name: 'communications', role_in_team: 'deputy_director', added_by: 4 },
            { user_id: 6, team_name: 'communications', role_in_team: 'press_secretary', added_by: 4 },
            { user_id: 7, team_name: 'communications', role_in_team: 'senior_writer', added_by: 4 },
            { user_id: 8, team_name: 'communications', role_in_team: 'writer', added_by: 4 },
            { user_id: 9, team_name: 'communications', role_in_team: 'writer', added_by: 4 },
            { user_id: 21, team_name: 'communications', role_in_team: 'intern', added_by: 5 },

            // Research Team
            { user_id: 10, team_name: 'research', role_in_team: 'director', added_by: 2 },
            { user_id: 11, team_name: 'research', role_in_team: 'researcher', added_by: 10 },
            { user_id: 22, team_name: 'research', role_in_team: 'intern', added_by: 10 },

            // Digital Team
            { user_id: 12, team_name: 'digital', role_in_team: 'director', added_by: 2 },
            { user_id: 13, team_name: 'digital', role_in_team: 'coordinator', added_by: 12 },

            // Field Operations Team
            { user_id: 14, team_name: 'field', role_in_team: 'director', added_by: 2 },
            { user_id: 15, team_name: 'field', role_in_team: 'organizer', added_by: 14 },
            { user_id: 16, team_name: 'field', role_in_team: 'volunteer_coordinator', added_by: 14 },
            { user_id: 20, team_name: 'field', role_in_team: 'volunteer', added_by: 16 },

            // Finance Team
            { user_id: 17, team_name: 'finance', role_in_team: 'director', added_by: 2 },
            { user_id: 18, team_name: 'finance', role_in_team: 'coordinator', added_by: 17 },

            // Editorial Review Team (Cross-functional for content approval)
            { user_id: 4, team_name: 'editorial_review', role_in_team: 'final_approver', added_by: 2 },
            { user_id: 5, team_name: 'editorial_review', role_in_team: 'strategic_editor', added_by: 4 },
            { user_id: 6, team_name: 'editorial_review', role_in_team: 'line_editor', added_by: 4 },
            { user_id: 7, team_name: 'editorial_review', role_in_team: 'peer_reviewer', added_by: 5 },
            { user_id: 10, team_name: 'editorial_review', role_in_team: 'fact_checker', added_by: 4 },

            // Crisis Response Team
            { user_id: 2, team_name: 'crisis_response', role_in_team: 'lead', added_by: 1 },
            { user_id: 4, team_name: 'crisis_response', role_in_team: 'communications_lead', added_by: 2 },
            { user_id: 5, team_name: 'crisis_response', role_in_team: 'rapid_response', added_by: 2 },
            { user_id: 6, team_name: 'crisis_response', role_in_team: 'media_contact', added_by: 4 },
            { user_id: 10, team_name: 'crisis_response', role_in_team: 'research_support', added_by: 4 }
        ];

        for (const tm of teamMemberships) {
            try {
                await this.run(
                    'INSERT OR IGNORE INTO team_memberships (user_id, team_name, role_in_team, added_by) VALUES (?, ?, ?, ?)',
                    [tm.user_id, tm.team_name, tm.role_in_team, tm.added_by]
                );
            } catch (error) {
                console.error('Error seeding team membership:', tm, error);
            }
        }

        console.log('👥 Seeded team memberships');
    }

    // Helper methods
    async columnExists(tableName, columnName) {
        try {
            const result = await this.get(`PRAGMA table_info(${tableName})`);
            const columns = await this.all(`PRAGMA table_info(${tableName})`);
            return columns.some(col => col.name === columnName);
        } catch (error) {
            console.error(`Error checking column existence: ${tableName}.${columnName}`, error);
            return false;
        }
    }

    run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        });
    }
}

module.exports = new Database();