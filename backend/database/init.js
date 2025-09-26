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
                FOREIGN KEY (assignor_id) REFERENCES users(id),
                FOREIGN KEY (assignee_id) REFERENCES users(id)
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
            )`
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