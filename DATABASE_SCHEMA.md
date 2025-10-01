# Campaign AI Editor - Database Schema Documentation

## Overview

The Campaign AI Editor uses SQLite databases to manage campaign content, user management, editorial workflows, and various political content types. The application uses a **hybrid database architecture**:

1. **Main Database** (`campaign.db` via `/Users/edf/campaign-ai-editor/backend/database/init.js`) - Core application data including users, assignments, and content blocks
2. **Campaign Settings Database** - Campaign-specific configuration (singleton pattern)
3. **App Settings Database** - Parser and editor configuration settings
4. **Assignments Database** - Press release workflow management
5. **Boilerplate Database** - Boilerplate text tracking and management
6. **Quotes Database** - Quote extraction and management

## Database Architecture

### Main Database (campaign.db)
- Location: `./campaign.db` (configurable via `DATABASE_PATH` environment variable)
- Contains: Core tables for users, assignments, content, and political content types
- Initialized by: `backend/database/init.js` - Database class

### Specialized Databases
- Campaign Settings: `./data/campaign-settings.db`
- App Settings: `./data/app-settings.db`
- Assignments: `./data/assignments.db`

---

## Core Tables (Main Database)

### users
**Purpose**: User authentication, profiles, and role-based access control
**Manager**: UserManager (`backend/data/user-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| email | TEXT | UNIQUE, NOT NULL | User email address for login |
| password | TEXT | NOT NULL | Bcrypt hashed password |
| name | TEXT | NOT NULL | User full name |
| role | TEXT | DEFAULT 'writer' | User role (admin, campaign_manager, communications_director, writer, etc.) |
| department | TEXT | NULL | User department (Communications, Research, Digital, etc.) |
| supervisor_id | INTEGER | FOREIGN KEY users(id) | ID of user's supervisor |
| security_clearance | TEXT | DEFAULT 'internal' | Security level (public, internal, confidential, restricted, top_secret) |
| access_restrictions | TEXT | NULL | JSON string of access restrictions (hours, days, supervision_required) |
| is_active | BOOLEAN | DEFAULT TRUE | Whether account is active |
| last_password_change | DATETIME | DEFAULT CURRENT_TIMESTAMP | When password was last changed |
| failed_login_attempts | INTEGER | DEFAULT 0 | Counter for failed login attempts |
| locked_until | DATETIME | NULL | Account lock expiration timestamp |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| last_login | DATETIME | NULL | Last successful login |

**Relationships**:
- Self-referencing: supervisor_id → users(id) (hierarchical structure)
- Has many: assignments (via assignor_id, assignee_id)
- Has many: content items (via created_by)
- Has many: team_memberships
- Has many: user_permissions
- Has many: resource_access

**Indexes**: None explicitly defined (SQLite auto-indexes PRIMARY KEY and UNIQUE columns)

---

### assignments
**Purpose**: Main task/assignment tracking for all content types
**Manager**: ContentManager (`backend/data/content-manager.js`) for main DB assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Assignment identifier (e.g., "A-2024-001") |
| title | TEXT | NOT NULL | Assignment title |
| description | TEXT | NULL | Brief description |
| brief | TEXT | NULL | Detailed brief/instructions |
| assignor_id | INTEGER | FOREIGN KEY users(id) | User who created assignment |
| assignee_id | INTEGER | FOREIGN KEY users(id) | User assigned to work on it |
| status | TEXT | DEFAULT 'pending' | Status (pending, in_progress, review, completed, blocked) |
| priority | TEXT | DEFAULT 'medium' | Priority level (urgent, high, medium, low) |
| due_date | DATETIME | NULL | Final due date |
| assignment_type | TEXT | DEFAULT 'press-release' | Type of assignment |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| completed_at | DATETIME | NULL | Completion timestamp |
| feedback | TEXT | NULL | Feedback on assignment |
| revision_type | TEXT | NULL | Type of revision needed |
| returned_by | INTEGER | FOREIGN KEY users(id) | User who returned for revision |
| returned_at | DATETIME | NULL | When returned for revision |
| clarification_request | TEXT | NULL | Clarification request text |
| clarification_requested_by | INTEGER | FOREIGN KEY users(id) | User requesting clarification |
| clarification_requested_at | DATETIME | NULL | When clarification requested |
| clarification_response | TEXT | NULL | Response to clarification |
| clarification_provided_by | INTEGER | FOREIGN KEY users(id) | User providing clarification |
| clarification_provided_at | DATETIME | NULL | When clarification provided |
| specific_questions | TEXT | NULL | Specific questions on assignment |
| notes | TEXT | NULL | Additional notes |

**Relationships**:
- Belongs to: users (via assignor_id, assignee_id, returned_by, clarification_requested_by, clarification_provided_by)
- Has many: content_blocks
- Has many: content_versions
- Has many: research_queries
- Has many: workflows
- Has many: schema_exports
- Has many: fact_checks

**Indexes**: None explicitly defined in schema

---

### content_blocks
**Purpose**: Structured content blocks for editorial canvas
**Manager**: ContentManager (`backend/data/content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique block ID |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| block_id | TEXT | NOT NULL | Client-side block identifier |
| type | TEXT | NOT NULL | Block type (heading, paragraph, quote, etc.) |
| content | TEXT | NULL | Block content/text |
| data | TEXT | NULL | JSON data for block metadata |
| position | INTEGER | NULL | Display order position |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Relationships**:
- Belongs to: assignments (via assignment_id)

**Indexes**: None explicitly defined

---

### content_versions
**Purpose**: Version history tracking for content
**Manager**: ContentManager (`backend/data/content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique version ID |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| user_id | INTEGER | FOREIGN KEY users(id) | User who created version |
| version_data | TEXT | NULL | JSON snapshot of content |
| message | TEXT | NULL | Version commit message |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Version creation timestamp |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via user_id)

**Indexes**: None explicitly defined

---

### research_queries
**Purpose**: Track AI research queries and responses
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique query ID |
| user_id | INTEGER | FOREIGN KEY users(id) | User who made query |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| query | TEXT | NOT NULL | Research query text |
| response | TEXT | NULL | AI response |
| topic | TEXT | NULL | Query topic/category |
| sources | TEXT | NULL | Sources used in response |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Query timestamp |

**Relationships**:
- Belongs to: users (via user_id)
- Belongs to: assignments (via assignment_id)

**Indexes**: None explicitly defined

---

### workflows
**Purpose**: Track workflow state transitions
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique workflow event ID |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| from_status | TEXT | NULL | Previous status |
| to_status | TEXT | NULL | New status |
| user_id | INTEGER | FOREIGN KEY users(id) | User who triggered transition |
| notes | TEXT | NULL | Transition notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Transition timestamp |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via user_id)

**Indexes**: None explicitly defined

---

### templates
**Purpose**: Reusable content templates
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique template ID |
| name | TEXT | NOT NULL | Template name |
| type | TEXT | NOT NULL | Template type |
| content | TEXT | NOT NULL | Template content (JSON) |
| metadata | TEXT | NULL | Additional metadata |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created template |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Relationships**:
- Belongs to: users (via created_by)

**Indexes**: None explicitly defined

---

## Political Content Tables

### speeches
**Purpose**: Speech content and metadata
**Manager**: PoliticalContentManager (`backend/data/political-content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique speech ID |
| title | TEXT | NOT NULL | Speech title |
| content | TEXT | NOT NULL | Speech text |
| metadata | TEXT | NULL | JSON metadata |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| structured_data | TEXT | NULL | JSON-LD structured data |
| team_members | TEXT | NULL | JSON list of team members |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via created_by)
- Has many: speech_versions

---

### speech_versions
**Purpose**: Version history for speeches
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique version ID |
| speech_id | INTEGER | FOREIGN KEY speeches(id) | Associated speech |
| version_number | INTEGER | NOT NULL | Version sequence number |
| content | TEXT | NOT NULL | Speech content at this version |
| metadata | TEXT | NULL | Version metadata |
| changes_summary | TEXT | NULL | Summary of changes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Version timestamp |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created version |

**Relationships**:
- Belongs to: speeches (via speech_id)
- Belongs to: users (via created_by)

---

### social_posts
**Purpose**: Social media post content
**Manager**: PoliticalContentManager (`backend/data/political-content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique post ID |
| platform | TEXT | NOT NULL | Platform (Twitter, Facebook, Instagram, etc.) |
| content | TEXT | NOT NULL | Post content |
| media_urls | TEXT | NULL | JSON array of media URLs |
| hashtags | TEXT | NULL | JSON array of hashtags |
| scheduled_for | DATETIME | NULL | Scheduled post time |
| status | TEXT | DEFAULT 'draft' | Status (draft, scheduled, published) |
| engagement_data | TEXT | NULL | JSON engagement metrics |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| structured_data | TEXT | NULL | JSON-LD structured data |
| team_members | TEXT | NULL | JSON list of team members |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via created_by)

---

### press_releases
**Purpose**: Press release content and distribution
**Manager**: PoliticalContentManager (`backend/data/political-content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique press release ID |
| headline | TEXT | NOT NULL | Main headline |
| subheadline | TEXT | NULL | Secondary headline |
| content | TEXT | NOT NULL | Press release body |
| media_contact | TEXT | NULL | Media contact information |
| embargo_date | DATETIME | NULL | Embargo date if applicable |
| distribution_list | TEXT | NULL | Distribution list |
| status | TEXT | DEFAULT 'draft' | Status (draft, approved, published) |
| metadata | TEXT | NULL | Additional metadata |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created |
| approved_by | INTEGER | FOREIGN KEY users(id) | User who approved |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| structured_data | TEXT | NULL | JSON-LD structured data |
| team_members | TEXT | NULL | JSON list of team members |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via created_by, approved_by)

---

### policy_documents
**Purpose**: Policy position documents and briefings
**Manager**: PoliticalContentManager (`backend/data/political-content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique document ID |
| title | TEXT | NOT NULL | Document title |
| type | TEXT | NOT NULL | Document type |
| content | TEXT | NOT NULL | Document content |
| summary | TEXT | NULL | Executive summary |
| key_points | TEXT | NULL | Key points (JSON array) |
| status | TEXT | DEFAULT 'draft' | Status (draft, review, approved) |
| version | INTEGER | DEFAULT 1 | Document version number |
| metadata | TEXT | NULL | Additional metadata |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created |
| reviewed_by | INTEGER | FOREIGN KEY users(id) | User who reviewed |
| approved_by | INTEGER | FOREIGN KEY users(id) | User who approved |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| structured_data | TEXT | NULL | JSON-LD structured data |
| team_members | TEXT | NULL | JSON list of team members |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via created_by, reviewed_by, approved_by)

---

### event_content
**Purpose**: Campaign event information and logistics
**Manager**: PoliticalContentManager (`backend/data/political-content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique event ID |
| event_name | TEXT | NOT NULL | Event name |
| event_type | TEXT | NOT NULL | Type of event |
| date | DATETIME | NOT NULL | Event date and time |
| location | TEXT | NULL | Event location |
| description | TEXT | NULL | Event description |
| talking_points | TEXT | NULL | Key talking points |
| logistics | TEXT | NULL | Logistical information |
| media_advisory | TEXT | NULL | Media advisory text |
| status | TEXT | DEFAULT 'planned' | Event status |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| structured_data | TEXT | NULL | JSON-LD structured data |
| team_members | TEXT | NULL | JSON list of team members |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via created_by)

---

### campaign_materials
**Purpose**: Campaign marketing materials and collateral
**Manager**: PoliticalContentManager (`backend/data/political-content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique material ID |
| title | TEXT | NOT NULL | Material title |
| type | TEXT | NOT NULL | Material type (flyer, poster, brochure, etc.) |
| content | TEXT | NULL | Material content/copy |
| design_notes | TEXT | NULL | Design instructions |
| target_audience | TEXT | NULL | Target audience |
| distribution_channels | TEXT | NULL | Distribution channels |
| budget_allocated | DECIMAL(10,2) | NULL | Budget allocation |
| status | TEXT | DEFAULT 'concept' | Status (concept, design, review, approved) |
| metadata | TEXT | NULL | Additional metadata |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created |
| approved_by | INTEGER | FOREIGN KEY users(id) | User who approved |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| structured_data | TEXT | NULL | JSON-LD structured data |
| team_members | TEXT | NULL | JSON list of team members |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via created_by, approved_by)

---

### opposition_research
**Purpose**: Research on opponents and opposition tracking
**Manager**: PoliticalContentManager (`backend/data/political-content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique research item ID |
| subject | TEXT | NOT NULL | Research subject |
| category | TEXT | NOT NULL | Research category |
| content | TEXT | NOT NULL | Research findings |
| sources | TEXT | NULL | Sources (JSON array) |
| verification_status | TEXT | DEFAULT 'unverified' | Verification status |
| sensitivity_level | TEXT | DEFAULT 'internal' | Data sensitivity level |
| tags | TEXT | NULL | Tags for categorization |
| notes | TEXT | NULL | Additional notes |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| researched_by | INTEGER | FOREIGN KEY users(id) | User who conducted research |
| verified_by | INTEGER | FOREIGN KEY users(id) | User who verified |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| verification_notes | TEXT | NULL | Notes on verification |
| structured_data | TEXT | NULL | JSON-LD structured data |
| team_members | TEXT | NULL | JSON list of team members |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via researched_by, verified_by)

---

### voter_outreach
**Purpose**: Voter outreach campaign tracking
**Manager**: PoliticalContentManager (`backend/data/political-content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique outreach campaign ID |
| campaign_name | TEXT | NOT NULL | Campaign name |
| target_demographics | TEXT | NULL | Target demographic groups |
| message | TEXT | NOT NULL | Outreach message |
| channels | TEXT | NULL | Communication channels |
| geographic_focus | TEXT | NULL | Geographic targeting |
| budget | DECIMAL(10,2) | NULL | Campaign budget |
| start_date | DATE | NULL | Campaign start date |
| end_date | DATE | NULL | Campaign end date |
| metrics | TEXT | NULL | Performance metrics (JSON) |
| status | TEXT | DEFAULT 'planning' | Campaign status |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created |
| managed_by | INTEGER | FOREIGN KEY users(id) | User managing campaign |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| structured_data | TEXT | NULL | JSON-LD structured data |
| team_members | TEXT | NULL | JSON list of team members |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via created_by, managed_by)

---

### media_relations
**Purpose**: Media contact and relationship management
**Manager**: PoliticalContentManager (`backend/data/political-content-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique media contact ID |
| outlet_name | TEXT | NOT NULL | Media outlet name |
| contact_name | TEXT | NULL | Contact person name |
| contact_email | TEXT | NULL | Contact email |
| contact_phone | TEXT | NULL | Contact phone |
| beat | TEXT | NULL | Reporter's beat/coverage area |
| relationship_notes | TEXT | NULL | Relationship notes |
| last_contact | DATE | NULL | Last contact date |
| priority_level | TEXT | DEFAULT 'medium' | Contact priority |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| managed_by | INTEGER | FOREIGN KEY users(id) | User managing relationship |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| structured_data | TEXT | NULL | JSON-LD structured data |
| team_members | TEXT | NULL | JSON list of team members |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via managed_by)

---

### communications_briefs
**Purpose**: Communication strategy briefs
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique brief ID |
| title | TEXT | NOT NULL | Brief title |
| description | TEXT | NULL | Brief description |
| audience | TEXT | NULL | Target audience |
| tone | TEXT | NULL | Desired tone |
| key_points | TEXT | NULL | Key messaging points |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| status | TEXT | DEFAULT 'draft' | Brief status |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created |
| assigned_to | INTEGER | FOREIGN KEY users(id) | User assigned |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via created_by, assigned_to)

---

## Editorial & Collaboration Tables

### editor_operations
**Purpose**: Undo/redo operation tracking for collaborative editing
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique operation ID |
| session_id | TEXT | NOT NULL | Editor session identifier |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| content_type | TEXT | NULL | Type of content being edited |
| content_id | TEXT | NULL | Content item identifier |
| operation_type | TEXT | NOT NULL | Operation type (insert, delete, replace) |
| operation_data | TEXT | NOT NULL | JSON operation data |
| position_start | INTEGER | NULL | Start position in text |
| position_end | INTEGER | NULL | End position in text |
| content_before | TEXT | NULL | Content before operation |
| content_after | TEXT | NULL | Content after operation |
| timestamp | DATETIME | DEFAULT CURRENT_TIMESTAMP | Operation timestamp |
| user_id | INTEGER | FOREIGN KEY users(id) | User who performed operation |
| is_undone | BOOLEAN | DEFAULT FALSE | Whether operation was undone |
| is_checkpoint | BOOLEAN | DEFAULT FALSE | Whether this is a checkpoint |
| sequence_number | INTEGER | NULL | Sequence in operation history |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via user_id)

---

### editor_sessions
**Purpose**: Track active editing sessions for real-time collaboration
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique session ID |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| content_type | TEXT | NULL | Type of content |
| content_id | TEXT | NULL | Content identifier |
| user_id | INTEGER | FOREIGN KEY users(id) | User in session |
| started_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Session start |
| last_activity | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last activity timestamp |
| status | TEXT | DEFAULT 'active' | Session status |
| cursor_position | INTEGER | DEFAULT 0 | Current cursor position |
| selection_start | INTEGER | DEFAULT 0 | Selection start position |
| selection_end | INTEGER | DEFAULT 0 | Selection end position |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via user_id)

---

### editorial_comments
**Purpose**: Comments and feedback on content
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique comment ID |
| resource_type | TEXT | NOT NULL | Type of resource commented on |
| resource_id | TEXT | NOT NULL | Resource identifier |
| parent_comment_id | INTEGER | FOREIGN KEY editorial_comments(id) | Parent comment for threading |
| user_id | INTEGER | NOT NULL, FOREIGN KEY users(id) | User who made comment |
| comment_text | TEXT | NOT NULL | Comment content |
| comment_type | TEXT | DEFAULT 'general' | Comment type (general, suggestion, question) |
| selection_start | INTEGER | NULL | Text selection start |
| selection_end | INTEGER | NULL | Text selection end |
| selected_text | TEXT | NULL | Selected text snippet |
| status | TEXT | DEFAULT 'active' | Comment status |
| priority | TEXT | DEFAULT 'normal' | Comment priority |
| resolved_at | DATETIME | NULL | Resolution timestamp |
| resolved_by | INTEGER | FOREIGN KEY users(id) | User who resolved |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Relationships**:
- Self-referencing: parent_comment_id → editorial_comments(id)
- Belongs to: users (via user_id, resolved_by)
- Has many: comment_reactions

---

### comment_reactions
**Purpose**: Reactions/votes on editorial comments
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique reaction ID |
| comment_id | INTEGER | NOT NULL, FOREIGN KEY editorial_comments(id) | Comment being reacted to |
| user_id | INTEGER | NOT NULL, FOREIGN KEY users(id) | User who reacted |
| reaction_type | TEXT | NOT NULL | Type of reaction (upvote, heart, etc.) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Reaction timestamp |

**Unique Constraint**: (comment_id, user_id, reaction_type)

**Relationships**:
- Belongs to: editorial_comments (via comment_id)
- Belongs to: users (via user_id)

---

### editorial_reviews
**Purpose**: Track editorial review stages and approvals
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique review ID |
| resource_type | TEXT | NOT NULL | Type of resource reviewed |
| resource_id | TEXT | NOT NULL | Resource identifier |
| reviewer_id | INTEGER | NOT NULL, FOREIGN KEY users(id) | User conducting review |
| review_stage | TEXT | NOT NULL | Review stage (copy_edit, fact_check, etc.) |
| review_status | TEXT | NOT NULL | Review status (pending, approved, rejected) |
| review_notes | TEXT | NULL | Review notes |
| issues_found | INTEGER | DEFAULT 0 | Number of issues found |
| time_spent_minutes | INTEGER | NULL | Time spent on review |
| next_reviewer_id | INTEGER | FOREIGN KEY users(id) | Next reviewer if applicable |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Review start timestamp |
| completed_at | DATETIME | NULL | Review completion timestamp |

**Relationships**:
- Belongs to: users (via reviewer_id, next_reviewer_id)

---

### style_check_results
**Purpose**: Store automated style and grammar check results
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique result ID |
| resource_type | TEXT | NOT NULL | Type of resource checked |
| resource_id | TEXT | NOT NULL | Resource identifier |
| check_type | TEXT | NOT NULL | Type of check performed |
| overall_score | INTEGER | NULL | Overall quality score |
| violations_count | INTEGER | DEFAULT 0 | Number of violations found |
| suggestions_count | INTEGER | DEFAULT 0 | Number of suggestions |
| detailed_results | TEXT | NULL | JSON detailed results |
| checked_by | INTEGER | FOREIGN KEY users(id) | User who ran check |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Check timestamp |

**Relationships**:
- Belongs to: users (via checked_by)

---

## Access Control & Security Tables

### role_permissions
**Purpose**: Role-based permission definitions
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique permission ID |
| role | TEXT | NOT NULL | Role name |
| permission | TEXT | NOT NULL | Permission identifier |
| granted_by | INTEGER | FOREIGN KEY users(id) | User who granted permission |
| granted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Grant timestamp |
| expires_at | DATETIME | NULL | Permission expiration |
| is_active | BOOLEAN | DEFAULT TRUE | Whether permission is active |

**Unique Constraint**: (role, permission)

**Relationships**:
- Belongs to: users (via granted_by)

---

### user_permissions
**Purpose**: Individual user permission overrides
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique permission ID |
| user_id | INTEGER | NOT NULL, FOREIGN KEY users(id) | User receiving permission |
| permission | TEXT | NOT NULL | Permission identifier |
| granted_by | INTEGER | FOREIGN KEY users(id) | User who granted permission |
| granted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Grant timestamp |
| expires_at | DATETIME | NULL | Permission expiration |
| is_active | BOOLEAN | DEFAULT TRUE | Whether permission is active |

**Unique Constraint**: (user_id, permission)

**Relationships**:
- Belongs to: users (via user_id, granted_by)

---

### resource_access
**Purpose**: Resource-specific access control
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique access record ID |
| user_id | INTEGER | NOT NULL, FOREIGN KEY users(id) | User being granted access |
| resource_type | TEXT | NOT NULL | Type of resource |
| resource_id | TEXT | NOT NULL | Resource identifier |
| permission_type | TEXT | NOT NULL | Permission type (read, write, approve) |
| granted_by | INTEGER | FOREIGN KEY users(id) | User who granted access |
| granted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Grant timestamp |
| expires_at | DATETIME | NULL | Access expiration |
| is_active | BOOLEAN | DEFAULT TRUE | Whether access is active |

**Relationships**:
- Belongs to: users (via user_id, granted_by)

---

### access_logs
**Purpose**: Audit trail for user actions
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique log entry ID |
| user_id | INTEGER | FOREIGN KEY users(id) | User performing action |
| action | TEXT | NOT NULL | Action performed |
| resource_type | TEXT | NULL | Type of resource accessed |
| resource_id | TEXT | NULL | Resource identifier |
| ip_address | TEXT | NULL | Client IP address |
| user_agent | TEXT | NULL | Client user agent |
| success | BOOLEAN | DEFAULT TRUE | Whether action succeeded |
| error_message | TEXT | NULL | Error message if failed |
| timestamp | DATETIME | DEFAULT CURRENT_TIMESTAMP | Action timestamp |

**Relationships**:
- Belongs to: users (via user_id)

---

### team_memberships
**Purpose**: Team membership tracking
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique membership ID |
| user_id | INTEGER | NOT NULL, FOREIGN KEY users(id) | Team member |
| team_name | TEXT | NOT NULL | Team name |
| role_in_team | TEXT | DEFAULT 'member' | Role within team |
| added_by | INTEGER | FOREIGN KEY users(id) | User who added member |
| added_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Addition timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | Whether membership is active |

**Relationships**:
- Belongs to: users (via user_id, added_by)

---

### content_sensitivity
**Purpose**: Content sensitivity classification
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique classification ID |
| resource_type | TEXT | NOT NULL | Type of resource |
| resource_id | TEXT | NOT NULL | Resource identifier |
| sensitivity_level | TEXT | DEFAULT 'internal' | Sensitivity level |
| classification_reason | TEXT | NULL | Reason for classification |
| classified_by | INTEGER | FOREIGN KEY users(id) | User who classified |
| classified_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Classification timestamp |
| review_date | DATETIME | NULL | Next review date |

**Relationships**:
- Belongs to: users (via classified_by)

---

### fact_checks
**Purpose**: Fact-checking workflow and results
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique fact-check ID |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Related assignment |
| source_assignment_id | TEXT | FOREIGN KEY assignments(id) | Source assignment |
| content | TEXT | NOT NULL | Content being fact-checked |
| claims_to_verify | TEXT | NULL | Claims requiring verification |
| verified_claims | TEXT | NULL | Verified claims |
| disputed_claims | TEXT | NULL | Disputed claims |
| sources | TEXT | NULL | Source references |
| overall_rating | TEXT | NULL | Overall fact-check rating |
| status | TEXT | DEFAULT 'pending' | Fact-check status |
| assigned_to | INTEGER | FOREIGN KEY users(id) | Assigned fact-checker |
| created_by | INTEGER | FOREIGN KEY users(id) | User who created |
| completed_by | INTEGER | FOREIGN KEY users(id) | User who completed |
| fact_checker_notes | TEXT | NULL | Fact-checker notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| completed_at | DATETIME | NULL | Completion timestamp |

**Relationships**:
- Belongs to: assignments (via assignment_id, source_assignment_id)
- Belongs to: users (via assigned_to, created_by, completed_by)

---

### research_tracking
**Purpose**: Track research progress and milestones
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique tracking entry ID |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| user_id | INTEGER | FOREIGN KEY users(id) | User logging entry |
| status | TEXT | NULL | Current status |
| milestone | TEXT | NULL | Milestone reached |
| notes | TEXT | NULL | Research notes |
| time_estimate | INTEGER | NULL | Estimated time remaining |
| resources_needed | TEXT | NULL | Resources needed |
| logged_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Log timestamp |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via user_id)

---

### schema_exports
**Purpose**: Track schema.org / JSON-LD exports
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique export ID |
| assignment_id | TEXT | FOREIGN KEY assignments(id) | Associated assignment |
| schema_data | TEXT | NOT NULL | JSON-LD schema data |
| platform | TEXT | NULL | Target platform |
| exported_by | INTEGER | FOREIGN KEY users(id) | User who exported |
| exported_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Export timestamp |

**Relationships**:
- Belongs to: assignments (via assignment_id)
- Belongs to: users (via exported_by)

---

## Campaign Settings Tables

### campaign_settings
**Purpose**: Campaign-specific configuration (singleton)
**Manager**: CampaignSettingsManager (`backend/data/campaign-settings-manager.js`)
**Database**: `campaign-settings.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY CHECK (id = 1) | Always 1 (singleton) |
| candidate_name | TEXT | NOT NULL | Candidate full name |
| candidate_first_name | TEXT | NULL | First name |
| candidate_last_name | TEXT | NULL | Last name |
| candidate_title | TEXT | NULL | Current title/position |
| candidate_pronouns | TEXT | NULL | Preferred pronouns |
| organization_name | TEXT | NOT NULL | Campaign organization name |
| organization_legal_name | TEXT | NULL | Legal entity name |
| office_sought | TEXT | NULL | Office running for |
| district | TEXT | NULL | Electoral district |
| party_affiliation | TEXT | NULL | Political party |
| election_date | DATE | NULL | Election date |
| election_type | TEXT | NULL | Election type (primary, general, special) |
| campaign_tagline | TEXT | NULL | Campaign slogan |
| primary_issues | TEXT | NULL | Key campaign issues |
| voice_profile | TEXT | DEFAULT 'professional' | Writing voice style |
| tone_guidelines | TEXT | NULL | Tone instructions |
| ap_style_strict | BOOLEAN | DEFAULT 1 | Enforce AP Style |
| press_contact_name | TEXT | NULL | Press contact name |
| press_contact_title | TEXT | NULL | Press contact title |
| press_contact_email | TEXT | NULL | Press contact email |
| press_contact_phone | TEXT | NULL | Press contact phone |
| campaign_website | TEXT | NULL | Campaign website URL |
| twitter_handle | TEXT | NULL | Twitter/X handle |
| facebook_handle | TEXT | NULL | Facebook handle |
| instagram_handle | TEXT | NULL | Instagram handle |
| boilerplate_short | TEXT | NULL | Short boilerplate bio (100 words) |
| boilerplate_long | TEXT | NULL | Long boilerplate bio (200-300 words) |
| auto_extract_context | BOOLEAN | DEFAULT 0 | Auto-extract context from settings |
| default_release_type | TEXT | DEFAULT 'general' | Default press release type |
| preferred_quote_style | TEXT | DEFAULT 'conversational' | Preferred quote style |
| include_call_to_action | BOOLEAN | DEFAULT 1 | Include CTA in releases |
| default_cta_text | TEXT | NULL | Default call-to-action text |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| configured_by | TEXT | NULL | Who configured |
| last_modified_by | TEXT | NULL | Last modifier |

**Relationships**: None (singleton configuration table)

**Trigger**: `update_campaign_settings_timestamp` - Updates `updated_at` on changes

---

### campaign_team
**Purpose**: Campaign team member management
**Manager**: CampaignSettingsManager (`backend/data/campaign-settings-manager.js`)
**Database**: `campaign-settings.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique team member ID |
| user_id | TEXT | UNIQUE, NOT NULL | User identifier |
| user_name | TEXT | NOT NULL | User full name |
| user_email | TEXT | NULL | User email |
| role | TEXT | NOT NULL | Role (parser-reviewer, content-editor, admin) |
| permissions | TEXT | NULL | JSON array of permissions |
| active | BOOLEAN | DEFAULT 1 | Whether user is active |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| last_login | DATETIME | NULL | Last login timestamp |

**Relationships**: Conceptually linked to users table in main DB via user_id

---

### campaign_style_guide
**Purpose**: Custom style guide rules for campaign
**Manager**: CampaignSettingsManager (`backend/data/campaign-settings-manager.js`)
**Database**: `campaign-settings.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique rule ID |
| rule_type | TEXT | NOT NULL | Rule category (terminology, formatting, voice) |
| rule_name | TEXT | NOT NULL | Rule name |
| rule_description | TEXT | NULL | Rule description |
| examples | TEXT | NULL | JSON array of examples |
| active | BOOLEAN | DEFAULT 1 | Whether rule is active |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Relationships**: None

---

## App Settings Tables

### parser_settings
**Purpose**: Parser configuration (singleton)
**Manager**: AppSettingsManager (`backend/data/app-settings-manager.js`)
**Database**: `app-settings.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY CHECK (id = 1) | Always 1 (singleton) |
| auto_extract_context | BOOLEAN | DEFAULT 0 | Auto-extract context |
| validate_against_campaign_settings | BOOLEAN | DEFAULT 1 | Validate against campaign settings |
| context_confidence_threshold | REAL | DEFAULT 0.7 | Confidence threshold |
| extract_quotes | BOOLEAN | DEFAULT 1 | Extract quotes |
| extract_contact_info | BOOLEAN | DEFAULT 1 | Extract contact info |
| extract_boilerplate | BOOLEAN | DEFAULT 1 | Extract boilerplate |
| extract_dates | BOOLEAN | DEFAULT 1 | Extract dates |
| extract_locations | BOOLEAN | DEFAULT 1 | Extract locations |
| min_quote_words | INTEGER | DEFAULT 5 | Minimum quote length |
| max_quote_words | INTEGER | DEFAULT 100 | Maximum quote length |
| detect_quote_attribution | BOOLEAN | DEFAULT 1 | Detect who said quote |
| auto_detect_boilerplate | BOOLEAN | DEFAULT 1 | Auto-detect boilerplate |
| use_campaign_boilerplate | BOOLEAN | DEFAULT 1 | Use campaign boilerplate |
| boilerplate_similarity_threshold | REAL | DEFAULT 0.8 | Boilerplate match threshold |
| remove_excess_whitespace | BOOLEAN | DEFAULT 1 | Clean whitespace |
| normalize_line_breaks | BOOLEAN | DEFAULT 1 | Normalize line breaks |
| fix_common_typos | BOOLEAN | DEFAULT 0 | Auto-fix typos |
| confidence_threshold | REAL | DEFAULT 0.5 | General confidence threshold |
| field_movement_detection | BOOLEAN | DEFAULT 1 | Detect misplaced fields |
| max_tokens_per_request | INTEGER | DEFAULT 4000 | Max tokens for AI |
| temperature | REAL | DEFAULT 0.1 | AI temperature |
| use_cache | BOOLEAN | DEFAULT 1 | Use caching |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Trigger**: `update_parser_settings_timestamp` - Updates `updated_at` on changes

---

### editor_settings
**Purpose**: Editor configuration (singleton)
**Manager**: AppSettingsManager (`backend/data/app-settings-manager.js`)
**Database**: `app-settings.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY CHECK (id = 1) | Always 1 (singleton) |
| ai_assistance_level | TEXT | DEFAULT 'balanced' | AI assistance level (minimal, balanced, aggressive) |
| auto_apply_high_confidence | BOOLEAN | DEFAULT 0 | Auto-apply high-confidence suggestions |
| high_confidence_threshold | REAL | DEFAULT 0.9 | High confidence threshold |
| enable_quality_checks | BOOLEAN | DEFAULT 1 | Enable quality checks |
| check_ap_style | BOOLEAN | DEFAULT 1 | Check AP Style |
| check_ap_dates | BOOLEAN | DEFAULT 1 | Check AP date format |
| check_ap_states | BOOLEAN | DEFAULT 1 | Check AP state abbreviations |
| check_ap_titles | BOOLEAN | DEFAULT 1 | Check AP title format |
| check_ap_numbers | BOOLEAN | DEFAULT 1 | Check AP number style |
| check_ap_abbreviations | BOOLEAN | DEFAULT 1 | Check AP abbreviations |
| check_ap_punctuation | BOOLEAN | DEFAULT 1 | Check AP punctuation |
| check_grammar | BOOLEAN | DEFAULT 1 | Check grammar |
| check_spelling | BOOLEAN | DEFAULT 1 | Check spelling |
| check_punctuation | BOOLEAN | DEFAULT 1 | Check punctuation |
| check_sentence_structure | BOOLEAN | DEFAULT 1 | Check sentence structure |
| check_voice_consistency | BOOLEAN | DEFAULT 1 | Check voice consistency |
| check_tone_appropriateness | BOOLEAN | DEFAULT 1 | Check tone |
| check_reading_level | BOOLEAN | DEFAULT 1 | Check reading level |
| target_reading_level | INTEGER | DEFAULT 10 | Target grade level |
| suggest_prose_improvements | BOOLEAN | DEFAULT 1 | Suggest improvements |
| suggest_stronger_verbs | BOOLEAN | DEFAULT 1 | Suggest stronger verbs |
| suggest_quote_improvements | BOOLEAN | DEFAULT 1 | Suggest quote improvements |
| suggest_headline_alternatives | BOOLEAN | DEFAULT 1 | Suggest headline alternatives |
| check_redundancy | BOOLEAN | DEFAULT 1 | Check for redundancy |
| check_wordiness | BOOLEAN | DEFAULT 1 | Check for wordiness |
| check_fact_consistency | BOOLEAN | DEFAULT 1 | Check fact consistency |
| flag_unsupported_claims | BOOLEAN | DEFAULT 1 | Flag unsupported claims |
| check_opponent_mentions | BOOLEAN | DEFAULT 1 | Check opponent mentions |
| check_sensitive_language | BOOLEAN | DEFAULT 1 | Check sensitive language |
| check_seo_optimization | BOOLEAN | DEFAULT 1 | Check SEO |
| check_social_media_friendly | BOOLEAN | DEFAULT 1 | Check social media friendliness |
| suggest_pull_quotes | BOOLEAN | DEFAULT 1 | Suggest pull quotes |
| check_formatting_consistency | BOOLEAN | DEFAULT 1 | Check formatting |
| enforce_style_guide | BOOLEAN | DEFAULT 1 | Enforce style guide |
| check_link_validity | BOOLEAN | DEFAULT 0 | Check link validity |
| track_all_changes | BOOLEAN | DEFAULT 1 | Track all changes |
| show_change_rationale | BOOLEAN | DEFAULT 1 | Show change reasoning |
| require_approval_for_major_changes | BOOLEAN | DEFAULT 1 | Require approval for major changes |
| auto_save_enabled | BOOLEAN | DEFAULT 1 | Enable auto-save |
| auto_save_interval | INTEGER | DEFAULT 30 | Auto-save interval (seconds) |
| keep_version_history | BOOLEAN | DEFAULT 1 | Keep version history |
| max_versions_to_keep | INTEGER | DEFAULT 10 | Max versions to retain |
| notify_on_low_quality | BOOLEAN | DEFAULT 1 | Notify on low quality |
| notify_on_potential_issues | BOOLEAN | DEFAULT 1 | Notify on issues |
| quality_threshold | REAL | DEFAULT 3.5 | Quality threshold (1-5) |
| real_time_suggestions | BOOLEAN | DEFAULT 1 | Real-time suggestions |
| debounce_delay | INTEGER | DEFAULT 500 | Debounce delay (ms) |
| max_suggestions_per_field | INTEGER | DEFAULT 5 | Max suggestions per field |
| suggestions_sort_order | TEXT | DEFAULT 'severity' | Sort order for suggestions |
| group_suggestions_by | TEXT | DEFAULT 'category' | Grouping method |
| show_accepted_suggestions | BOOLEAN | DEFAULT 0 | Show accepted suggestions |
| auto_scroll_to_suggestion | BOOLEAN | DEFAULT 1 | Auto-scroll to suggestion |
| collapse_low_priority | BOOLEAN | DEFAULT 1 | Collapse low priority suggestions |
| show_suggestions_inline | BOOLEAN | DEFAULT 1 | Show inline suggestions |
| show_suggestions_panel | BOOLEAN | DEFAULT 1 | Show suggestions panel |
| min_confidence_to_show | REAL | DEFAULT 0.5 | Min confidence to show |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Trigger**: `update_editor_settings_timestamp` - Updates `updated_at` on changes

---

### edit_check_config
**Purpose**: Individual edit check configurations
**Manager**: AppSettingsManager (`backend/data/app-settings-manager.js`)
**Database**: `app-settings.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique check ID |
| check_category | TEXT | NOT NULL | Category (ap-style, grammar, voice, etc.) |
| check_name | TEXT | NOT NULL UNIQUE | Check identifier |
| check_display_name | TEXT | NOT NULL | Display name |
| check_description | TEXT | NULL | Check description |
| enabled | BOOLEAN | DEFAULT 1 | Whether check is enabled |
| severity | TEXT | DEFAULT 'warning' | Severity (error, warning, suggestion) |
| auto_fix | BOOLEAN | DEFAULT 0 | Can auto-fix |
| confidence_required | REAL | DEFAULT 0.8 | Confidence needed to show |
| examples | TEXT | NULL | JSON array of examples |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Trigger**: `update_edit_check_config_timestamp` - Updates `updated_at` on changes

**Relationships**: None

---

### parser_field_config
**Purpose**: Parser field extraction configurations
**Manager**: AppSettingsManager (`backend/data/app-settings-manager.js`)
**Database**: `app-settings.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique field config ID |
| field_name | TEXT | NOT NULL UNIQUE | Field identifier |
| field_display_name | TEXT | NOT NULL | Display name |
| field_description | TEXT | NULL | Field description |
| enabled | BOOLEAN | DEFAULT 1 | Whether field extraction is enabled |
| required | BOOLEAN | DEFAULT 0 | Whether field is required |
| min_confidence | REAL | DEFAULT 0.5 | Minimum confidence for extraction |
| validation_rules | TEXT | NULL | JSON validation rules |
| extraction_hints | TEXT | NULL | Hints for better extraction |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Relationships**: None

---

## Press Release Workflow Tables (Assignments Database)

### assignments (Press Release Workflow)
**Purpose**: Press release assignment lifecycle tracking
**Manager**: AssignmentsManager (`backend/data/assignments-manager.js`)
**Database**: `assignments.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique assignment ID |
| title | TEXT | NOT NULL | Assignment title/headline |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly identifier |
| status | TEXT | DEFAULT 'parsing' | Workflow status |
| priority | TEXT | DEFAULT 'normal' | Priority (urgent, high, normal, low) |
| original_text | TEXT | NOT NULL | Raw submitted text |
| submitted_by | TEXT | NULL | Writer name/email |
| submitted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Submission timestamp |
| due_date | DATETIME | NULL | Final due date |
| validation_due_date | DATETIME | NULL | Validation due date |
| editing_due_date | DATETIME | NULL | Editing due date |
| parsed_at | DATETIME | NULL | Parse timestamp |
| parsed_by | TEXT | NULL | Who/what parsed |
| parsed_fields | JSON | NULL | Extracted fields JSON |
| parser_confidence | REAL | NULL | Parser confidence score |
| parser_quality_rating | INTEGER | NULL | 1-5 star rating |
| parser_quality_feedback | TEXT | NULL | Rating feedback |
| parser_quality_rated_by | TEXT | NULL | Who rated parser |
| parser_quality_rated_at | DATETIME | NULL | Rating timestamp |
| validation_started_at | DATETIME | NULL | Validation start |
| validation_started_by | TEXT | NULL | Validator name |
| validation_completed_at | DATETIME | NULL | Validation completion |
| validation_completed_by | TEXT | NULL | Validator name |
| validation_time_seconds | INTEGER | NULL | Time spent validating |
| validation_corrections_count | INTEGER | DEFAULT 0 | Number of corrections |
| validated_fields | JSON | NULL | Validated fields JSON |
| editing_started_at | DATETIME | NULL | Editing start |
| editing_started_by | TEXT | NULL | Editor name |
| editing_completed_at | DATETIME | NULL | Editing completion |
| editing_completed_by | TEXT | NULL | Editor name |
| editing_time_seconds | INTEGER | NULL | Time spent editing |
| edited_fields | JSON | NULL | Edited fields JSON |
| quality_score | REAL | NULL | Overall quality (1-5) |
| ap_style_score | REAL | NULL | AP Style score |
| voice_consistency_score | REAL | NULL | Voice consistency score |
| grammar_score | REAL | NULL | Grammar score |
| final_html | TEXT | NULL | HTML export |
| final_text | TEXT | NULL | Plain text export |
| final_jsonld | TEXT | NULL | JSON-LD export |
| tracked_changes_html | TEXT | NULL | Tracked changes HTML |
| cms_bridge_json | TEXT | NULL | CMS integration format |
| published_at | DATETIME | NULL | Publication timestamp |
| published_by | TEXT | NULL | Publisher name |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| notes | TEXT | NULL | Additional notes |
| tags | TEXT | NULL | Comma-separated tags |

**Indexes**:
- idx_assignments_status ON (status)
- idx_assignments_validation_by ON (validation_completed_by)
- idx_assignments_editing_by ON (editing_completed_by)
- idx_assignments_created_at ON (created_at)
- idx_assignments_submitted_at ON (submitted_at)
- idx_assignments_due_date ON (due_date)
- idx_assignments_validation_due ON (validation_due_date)
- idx_assignments_editing_due ON (editing_due_date)

**Trigger**: `update_assignments_timestamp` - Updates `updated_at` on changes

---

### assignment_history
**Purpose**: Track all assignment state changes
**Manager**: AssignmentsManager (`backend/data/assignments-manager.js`)
**Database**: `assignments.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique history entry ID |
| assignment_id | INTEGER | NOT NULL, FOREIGN KEY assignments(id) CASCADE | Related assignment |
| changed_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Change timestamp |
| changed_by | TEXT | NOT NULL | User who made change |
| change_type | TEXT | NOT NULL | Type of change |
| field_name | TEXT | NULL | Field that changed |
| old_value | TEXT | NULL | Previous value |
| new_value | TEXT | NULL | New value |
| stage | TEXT | NULL | Workflow stage |
| role | TEXT | NULL | User role |
| reason | TEXT | NULL | Change reason |

**Relationships**:
- Belongs to: assignments (via assignment_id, CASCADE delete)

**Indexes**: idx_assignment_history_assignment ON (assignment_id)

---

### assignment_versions
**Purpose**: Version snapshots at each workflow stage
**Manager**: AssignmentsManager (`backend/data/assignments-manager.js`)
**Database**: `assignments.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique version ID |
| assignment_id | INTEGER | NOT NULL, FOREIGN KEY assignments(id) CASCADE | Related assignment |
| version_type | TEXT | NOT NULL | Version type (original, parsed, validated, edited, final) |
| version_number | INTEGER | NOT NULL | Version number within type |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Version timestamp |
| created_by | TEXT | NOT NULL | Who created version |
| fields_json | TEXT | NOT NULL | Complete field state JSON |
| html_snapshot | TEXT | NULL | Rendered HTML |
| notes | TEXT | NULL | Version notes |

**Unique Constraint**: (assignment_id, version_type, version_number)

**Relationships**:
- Belongs to: assignments (via assignment_id, CASCADE delete)

**Indexes**: idx_assignment_versions_assignment ON (assignment_id)

---

### parser_feedback
**Purpose**: Parser learning and improvement feedback
**Manager**: AssignmentsManager (`backend/data/assignments-manager.js`)
**Database**: `assignments.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique feedback ID |
| assignment_id | INTEGER | NOT NULL, FOREIGN KEY assignments(id) CASCADE | Related assignment |
| submitted_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Feedback timestamp |
| submitted_by | TEXT | NOT NULL | User providing feedback |
| field_name | TEXT | NOT NULL | Field with issue |
| parser_extracted | TEXT | NULL | What parser extracted |
| user_corrected | TEXT | NULL | What user corrected to |
| correction_type | TEXT | NULL | Type of correction |
| pattern_signals | JSON | NULL | ML training signals |

**Relationships**:
- Belongs to: assignments (via assignment_id, CASCADE delete)

**Indexes**: idx_parser_feedback_assignment ON (assignment_id)

---

### editorial_changes
**Purpose**: Track editorial improvements and patterns
**Manager**: AssignmentsManager (`backend/data/assignments-manager.js`)
**Database**: `assignments.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique change ID |
| assignment_id | INTEGER | NOT NULL, FOREIGN KEY assignments(id) CASCADE | Related assignment |
| changed_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Change timestamp |
| changed_by | TEXT | NOT NULL | Editor who made change |
| field_name | TEXT | NOT NULL | Field modified |
| original_value | TEXT | NULL | Original value |
| edited_value | TEXT | NULL | Edited value |
| change_type | TEXT | NULL | Change type (ai-suggested, editor-manual, auto-fix) |
| category | TEXT | NULL | Category (AP Style, Grammar, Voice, Enhancement) |
| ai_recommendation_accepted | BOOLEAN | NULL | Whether AI recommendation was accepted |
| quality_improvement | REAL | NULL | Estimated quality improvement |

**Relationships**:
- Belongs to: assignments (via assignment_id, CASCADE delete)

**Indexes**: idx_editorial_changes_assignment ON (assignment_id)

---

## Boilerplate Management Tables

### boilerplate_library
**Purpose**: Store and track boilerplate paragraphs
**Manager**: BoilerplateManager (`backend/data/boilerplate-manager.js`)
**Database**: Separate boilerplate database

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique boilerplate ID |
| candidate_name | TEXT | NOT NULL | Candidate name |
| campaign_id | TEXT | NULL | Campaign identifier |
| boilerplate_text | TEXT | NOT NULL | Boilerplate content |
| boilerplate_hash | TEXT | NOT NULL UNIQUE | SHA256 hash for matching |
| is_active | BOOLEAN | DEFAULT 1 | Whether boilerplate is active |
| first_seen_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | First occurrence |
| last_used_date | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last use |
| usage_count | INTEGER | DEFAULT 1 | Usage count |
| first_seen_in_release | TEXT | NULL | First release identifier |
| boilerplate_type | TEXT | DEFAULT 'campaign' | Type (campaign, organization, issue-specific) |
| confidence_score | REAL | DEFAULT 1.0 | Confidence score |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes**:
- idx_boilerplate_candidate ON (candidate_name)
- idx_boilerplate_hash ON (boilerplate_hash)
- idx_boilerplate_active ON (is_active)

**Trigger**: `update_boilerplate_usage_count` - Updates usage count and last_used_date when used

---

### boilerplate_usage
**Purpose**: Track each boilerplate usage
**Manager**: BoilerplateManager (`backend/data/boilerplate-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique usage ID |
| boilerplate_id | INTEGER | NOT NULL, FOREIGN KEY boilerplate_library(id) CASCADE | Boilerplate used |
| assignment_id | INTEGER | NULL, FOREIGN KEY assignments(id) SET NULL | Related assignment |
| was_modified | BOOLEAN | DEFAULT 0 | Whether modified |
| original_text | TEXT | NULL | Original boilerplate text |
| modified_text | TEXT | NULL | Modified text |
| modification_type | TEXT | NULL | Type (minor, significant, complete-rewrite) |
| similarity_score | REAL | NULL | Similarity (0.0-1.0) |
| modified_by | TEXT | NULL | Editor who modified |
| modification_notes | TEXT | NULL | Modification notes |
| used_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Usage timestamp |

**Relationships**:
- Belongs to: boilerplate_library (via boilerplate_id, CASCADE delete)
- Belongs to: assignments (via assignment_id, SET NULL on delete)

**Indexes**:
- idx_boilerplate_usage_assignment ON (assignment_id)
- idx_boilerplate_usage_modified ON (was_modified)

---

### boilerplate_warnings
**Purpose**: Warnings when boilerplate is edited
**Manager**: BoilerplateManager (`backend/data/boilerplate-manager.js`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique warning ID |
| assignment_id | INTEGER | NULL, FOREIGN KEY assignments(id) CASCADE | Related assignment |
| boilerplate_id | INTEGER | NULL, FOREIGN KEY boilerplate_library(id) CASCADE | Related boilerplate |
| warning_type | TEXT | NOT NULL | Warning type |
| warning_severity | TEXT | DEFAULT 'medium' | Severity (low, medium, high) |
| original_text | TEXT | NULL | Original boilerplate |
| attempted_change | TEXT | NULL | Attempted edit |
| editor_user | TEXT | NULL | Editor attempting change |
| editor_acknowledged | BOOLEAN | DEFAULT 0 | Whether acknowledged |
| acknowledged_at | DATETIME | NULL | Acknowledgment timestamp |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Warning timestamp |

**Relationships**:
- Belongs to: assignments (via assignment_id, CASCADE delete)
- Belongs to: boilerplate_library (via boilerplate_id, CASCADE delete)

**Indexes**: idx_boilerplate_warnings_assignment ON (assignment_id)

---

## Quote Management Tables

### extracted_quotes
**Purpose**: Track and protect extracted quotes
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique quote ID |
| assignment_id | INTEGER | NULL, FOREIGN KEY assignments(id) CASCADE | Related assignment |
| release_id | TEXT | NULL | Release identifier |
| quote_text | TEXT | NOT NULL | Quote content |
| quote_number | INTEGER | NULL | Quote sequence number |
| speaker_name | TEXT | NULL | Who said it |
| speaker_title | TEXT | NULL | Speaker's title |
| speaker_role | TEXT | NULL | Role (candidate, spokesperson, supporter, official) |
| position_in_text | INTEGER | NULL | Position in original text |
| paragraph_number | INTEGER | NULL | Paragraph number |
| quality_score | INTEGER | DEFAULT 100 | Quality score (0-100) |
| quality_issues | TEXT | NULL | JSON array of issues |
| needs_review | BOOLEAN | DEFAULT 0 | Needs review flag |
| is_protected | BOOLEAN | DEFAULT 1 | Protected from editing |
| preapproved | BOOLEAN | DEFAULT 0 | Pre-approved quote |
| approved_by | TEXT | NULL | Who approved |
| approved_at | DATETIME | NULL | Approval timestamp |
| original_quote | TEXT | NULL | Original if modified |
| was_modified | BOOLEAN | DEFAULT 0 | Whether modified |
| modified_at | DATETIME | NULL | Modification timestamp |
| modified_by | TEXT | NULL | Who modified |
| modification_reason | TEXT | NULL | Reason for modification |
| extraction_pattern | TEXT | NULL | Pattern that matched |
| extraction_confidence | REAL | DEFAULT 1.0 | Extraction confidence |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Relationships**:
- Belongs to: assignments (via assignment_id, CASCADE delete)

**Indexes**:
- idx_quotes_assignment ON (assignment_id)
- idx_quotes_speaker ON (speaker_name)
- idx_quotes_needs_review ON (needs_review)
- idx_quotes_protected ON (is_protected)

**Trigger**: `update_quote_modified` - Sets was_modified, modified_at when quote_text changes

---

### quote_modification_warnings
**Purpose**: Warnings for quote modification attempts
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique warning ID |
| quote_id | INTEGER | NOT NULL, FOREIGN KEY extracted_quotes(id) CASCADE | Related quote |
| assignment_id | INTEGER | NULL, FOREIGN KEY assignments(id) CASCADE | Related assignment |
| warning_type | TEXT | NOT NULL | Warning type |
| warning_severity | TEXT | DEFAULT 'high' | Severity |
| original_text | TEXT | NOT NULL | Original quote |
| attempted_change | TEXT | NOT NULL | Attempted change |
| editor_user | TEXT | NULL | Editor attempting change |
| editor_acknowledged | BOOLEAN | DEFAULT 0 | Acknowledged |
| acknowledged_at | DATETIME | NULL | Acknowledgment timestamp |
| acknowledgment_notes | TEXT | NULL | Acknowledgment notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Warning timestamp |

**Relationships**:
- Belongs to: extracted_quotes (via quote_id, CASCADE delete)
- Belongs to: assignments (via assignment_id, CASCADE delete)

**Indexes**:
- idx_quote_warnings_quote ON (quote_id)
- idx_quote_warnings_assignment ON (assignment_id)
- idx_quote_warnings_acknowledged ON (editor_acknowledged)

---

### quote_quality_issues
**Purpose**: Specific quality issues with quotes
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique issue ID |
| quote_id | INTEGER | NOT NULL, FOREIGN KEY extracted_quotes(id) CASCADE | Related quote |
| issue_type | TEXT | NOT NULL | Issue type |
| issue_severity | TEXT | NOT NULL | Severity (info, warning, error) |
| issue_message | TEXT | NOT NULL | Issue description |
| issue_details | TEXT | NULL | Additional details |
| auto_detected | BOOLEAN | DEFAULT 1 | Auto-detected vs manual |
| reported_by | TEXT | NULL | Who reported |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Issue timestamp |

**Relationships**:
- Belongs to: extracted_quotes (via quote_id, CASCADE delete)

**Indexes**:
- idx_quality_issues_quote ON (quote_id)
- idx_quality_issues_type ON (issue_type)
- idx_quality_issues_severity ON (issue_severity)

---

### quote_approvals
**Purpose**: Quote approval workflow
**Manager**: None (direct database access)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique approval ID |
| quote_id | INTEGER | NOT NULL, FOREIGN KEY extracted_quotes(id) CASCADE | Related quote |
| assignment_id | INTEGER | NULL, FOREIGN KEY assignments(id) CASCADE | Related assignment |
| requested_by | TEXT | NULL | Requester |
| requested_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Request timestamp |
| requested_for | TEXT | NULL | Approver email |
| status | TEXT | DEFAULT 'pending' | Status (pending, approved, rejected, revision-requested) |
| approved_by | TEXT | NULL | Approver |
| approved_at | DATETIME | NULL | Approval timestamp |
| feedback_notes | TEXT | NULL | Feedback |
| suggested_revision | TEXT | NULL | Suggested changes |
| reminder_sent_count | INTEGER | DEFAULT 0 | Reminder count |
| last_reminder_at | DATETIME | NULL | Last reminder timestamp |

**Relationships**:
- Belongs to: extracted_quotes (via quote_id, CASCADE delete)
- Belongs to: assignments (via assignment_id, CASCADE delete)

**Indexes**:
- idx_quote_approvals_status ON (status)
- idx_quote_approvals_requested_for ON (requested_for)

---

## Manager Classes

### UserManager
**File**: `backend/data/user-manager.js`
**Tables**: users (main database)

**Key Methods**:
- `getUserByEmail(email)` - Find user by email address
- `getUserById(id)` - Find user by ID
- `getUserByRole(role)` - Find first user with specific role
- `updateLastLogin(userId)` - Update last login timestamp
- `createUser(userData)` - Create new user
- `updateUser(userId, userData)` - Update user data
- `deleteUser(userId)` - Delete user
- `getAllUsers(roleFilter)` - Get all users, optionally filtered by role
- `emailExists(email, excludeUserId)` - Check if email is already registered

---

### ContentManager
**File**: `backend/data/content-manager.js`
**Tables**: content_blocks, content_versions, assignments (main database)

**Key Methods**:
- `saveBlocks(assignmentId, blocks)` - Save content blocks (replaces existing)
- `getBlocks(assignmentId)` - Get all blocks for assignment
- `saveVersion(assignmentId, versionData, message, userId)` - Save content version
- `getVersions(assignmentId, limit)` - Get version history
- `getVersion(versionId)` - Get specific version with data
- `deleteBlocks(assignmentId)` - Delete all blocks for assignment
- `getBlockById(assignmentId, blockId)` - Get single block
- `updateAssignmentTimestamp(assignmentId)` - Update assignment modified time

---

### PoliticalContentManager
**File**: `backend/data/political-content-manager.js`
**Tables**: All political content tables (speeches, social_posts, policy_documents, press_releases, event_content, campaign_materials, opposition_research, voter_outreach, media_relations)

**Key Methods**:
- `getAll(tableName, filters)` - Get all items with filtering
- `getById(tableName, id, userId)` - Get single item by ID
- `create(tableName, data, userId)` - Create new item
- `update(tableName, id, data, userId)` - Update item
- `delete(tableName, id, userId)` - Delete item
- `bulkDelete(tableName, ids, userId)` - Delete multiple items
- `bulkUpdate(tableName, ids, data, userId)` - Update multiple items
- `search(tableName, query, searchFields, userId, limit)` - Search content
- `getAnalytics(tableName, userId)` - Get analytics data

**Security**: Validates table names against whitelist, enforces user ownership checks

---

### CampaignSettingsManager
**File**: `backend/data/campaign-settings-manager.js`
**Database**: `campaign-settings.db`
**Tables**: campaign_settings, campaign_team, campaign_style_guide

**Key Methods**:
- `initialize()` - Initialize database and schema
- `getSettings()` - Get campaign settings (cached)
- `updateSettings(settings)` - Update campaign settings
- `isConfigured()` - Check if campaign is configured
- `getParserContext()` - Get context formatted for parser
- `addTeamMember(member)` - Add team member
- `getTeamMembers()` - Get all active team members
- `addStyleRule(rule)` - Add custom style guide rule
- `getStyleRules(ruleType)` - Get style guide rules
- `getSettingsSummary()` - Get human-readable settings summary
- `close()` - Close database connection

---

### AppSettingsManager
**File**: `backend/data/app-settings-manager.js`
**Database**: `app-settings.db`
**Tables**: parser_settings, editor_settings, edit_check_config, parser_field_config

**Key Methods**:
- `initialize()` - Initialize database and schema
- `getParserSettings()` - Get parser settings (cached)
- `updateParserSettings(settings)` - Update parser settings
- `getEditorSettings()` - Get editor settings (cached)
- `updateEditorSettings(settings)` - Update editor settings
- `getEditChecks(category)` - Get edit checks, optionally by category
- `updateEditCheck(checkName, updates)` - Update specific edit check
- `toggleEditCheck(checkName, enabled)` - Enable/disable edit check
- `bulkToggleEditChecks(category, enabled)` - Enable/disable category
- `getParserFields()` - Get enabled parser fields
- `updateParserField(fieldName, updates)` - Update parser field config
- `getEnabledEditChecks()` - Get only enabled edit checks
- `getEditChecksByCategory()` - Get checks grouped by category
- `isEditCheckEnabled(checkName)` - Check if specific check is enabled
- `getParserSettingsSummary()` - Get parser settings summary
- `getEditorSettingsSummary()` - Get editor settings summary
- `close()` - Close database connection

---

### AssignmentsManager
**File**: `backend/data/assignments-manager.js`
**Database**: `assignments.db`
**Tables**: assignments, assignment_history, assignment_versions, parser_feedback, editorial_changes

**Key Methods**:
- `initialize()` - Initialize database and schema
- `createAssignment(data)` - Create new press release assignment
- `getAssignmentsNeedingValidation(filters)` - Get assignments for parser reviewers
- `getAssignmentsNeedingEditing(filters)` - Get assignments for content editors
- `startValidation(assignmentId, userId)` - Claim assignment for validation
- `completeValidation(assignmentId, userId, validatedFields, correctionsCount, timeSpent)` - Complete validation stage
- `rateParserQuality(assignmentId, userId, rating, feedback)` - Rate parser performance
- `getParserQualityStats()` - Get parser statistics
- `getRecentParserRatings(limit)` - Get recent parser ratings
- `startEditing(assignmentId, userId)` - Claim assignment for editing
- `completeEditing(assignmentId, userId, editedFields, outputs, timeSpent, qualityScores)` - Complete editing stage
- `getAssignment(assignmentId)` - Get assignment by ID
- `getAssignmentBySlug(slug)` - Get assignment by slug
- `getAssignmentHistory(assignmentId)` - Get change history
- `getAssignmentVersions(assignmentId)` - Get version snapshots
- `recordParserFeedback(assignmentId, userId, feedback)` - Record parser learning feedback
- `recordEditorialChange(assignmentId, userId, change)` - Record editorial change
- `generateSlug(title)` - Generate URL-friendly slug
- `getStatistics()` - Get overall statistics
- `close()` - Close database connection

---

### BoilerplateManager
**File**: `backend/data/boilerplate-manager.js`
**Tables**: boilerplate_library, boilerplate_usage, boilerplate_warnings

**Key Methods**:
- `calculateHash(text)` - Calculate SHA256 hash for boilerplate
- `calculateSimilarity(text1, text2)` - Calculate text similarity (0.0-1.0)
- `addBoilerplate(candidateName, boilerplateText, metadata)` - Add or update boilerplate
- `findMatchingBoilerplate(candidateName, text, minSimilarity)` - Find matching boilerplate
- `recordUsage(boilerplateId, assignmentId, originalText, modifiedText)` - Record boilerplate usage
- `createWarning(assignmentId, boilerplateId, warningType, originalText, attemptedChange, editorUser)` - Create modification warning
- `getBoilerplatesForCandidate(candidateName)` - Get all boilerplates for candidate
- `getModificationHistory(candidateName, limit)` - Get modification history
- `getWarningsForAssignment(assignmentId)` - Get warnings for assignment
- `acknowledgeWarning(warningId, editorUser)` - Acknowledge warning
- `deactivateBoilerplate(boilerplateId)` - Deactivate boilerplate

---

## Entity Relationship Diagram

```
┌──────────────┐
│    users     │
└──────┬───────┘
       │ 1:N (supervisor_id)
       ├──────────────────────────────────────┐
       │                                      │
       │ 1:N (assignor_id, assignee_id)      │ 1:N (created_by)
       │                                      │
┌──────▼──────────┐                  ┌───────▼────────────┐
│  assignments    │                  │  speeches          │
└────┬────────┬───┘                  │  social_posts      │
     │ 1:N    │ 1:N                  │  press_releases    │
     │        │                      │  policy_documents  │
     │        │                      │  event_content     │
     │        │                      │  campaign_materials│
     │        │                      │  opposition_research│
     │        │                      │  voter_outreach    │
     │        │                      │  media_relations   │
     │        │                      └────────────────────┘
     │        │
     │        └─────────────────────────┐
┌────▼──────────────┐          ┌───────▼────────────────┐
│ content_blocks    │          │ content_versions       │
└───────────────────┘          └────────────────────────┘

┌──────────────┐  1:N  ┌─────────────────────┐
│  users       │◄──────┤ team_memberships     │
└──────┬───────┘       └─────────────────────┘
       │ 1:N
┌──────▼───────────┐
│ user_permissions │
└──────────────────┘

┌──────────────────┐  1:N  ┌──────────────────────┐
│ editorial_       │◄──────┤ comment_reactions    │
│ comments         │       └──────────────────────┘
└──────────────────┘

┌────────────────────┐  1:N  ┌──────────────────────┐
│ boilerplate_       │◄──────┤ boilerplate_usage    │
│ library            │       │ boilerplate_warnings │
└────────────────────┘       └──────────────────────┘

┌────────────────────┐  1:N  ┌──────────────────────┐
│ extracted_quotes   │◄──────┤ quote_quality_issues │
│                    │       │ quote_approvals      │
│                    │       │ quote_modification_  │
│                    │       │ warnings             │
└────────────────────┘       └──────────────────────┘

┌────────────────────┐
│ assignments        │  (Press Release Workflow DB)
│ (press release)    │
└────┬───────────────┘
     │ 1:N
     ├──────────────┬──────────────┬────────────────┐
     │              │              │                │
┌────▼────────┐ ┌──▼──────────┐ ┌─▼────────────┐ ┌▼──────────────┐
│ assignment_ │ │ assignment_ │ │ parser_      │ │ editorial_    │
│ history     │ │ versions    │ │ feedback     │ │ changes       │
└─────────────┘ └─────────────┘ └──────────────┘ └───────────────┘
```

## Indexes Summary

**Main Database**:
- All PRIMARY KEY columns are automatically indexed by SQLite
- All UNIQUE constraint columns are automatically indexed by SQLite
- No additional explicit indexes defined in init.js

**Assignments Database** (`assignments.db`):
- idx_assignments_status
- idx_assignments_validation_by
- idx_assignments_editing_by
- idx_assignments_created_at
- idx_assignments_submitted_at
- idx_assignments_due_date
- idx_assignments_validation_due
- idx_assignments_editing_due
- idx_assignment_history_assignment
- idx_assignment_versions_assignment
- idx_parser_feedback_assignment
- idx_editorial_changes_assignment

**Boilerplate Database**:
- idx_boilerplate_candidate
- idx_boilerplate_hash
- idx_boilerplate_active
- idx_boilerplate_usage_assignment
- idx_boilerplate_usage_modified
- idx_boilerplate_warnings_assignment

**Quotes Database**:
- idx_quotes_assignment
- idx_quotes_speaker
- idx_quotes_needs_review
- idx_quotes_protected
- idx_quote_warnings_quote
- idx_quote_warnings_assignment
- idx_quote_warnings_acknowledged
- idx_quality_issues_quote
- idx_quality_issues_type
- idx_quality_issues_severity
- idx_quote_approvals_status
- idx_quote_approvals_requested_for

## Migrations & Schema Evolution

The application uses dynamic schema migrations via the `Database.columnExists()` helper method in `backend/database/init.js`. Key migrations include:

1. **assignment_type column** - Added to assignments table (DEFAULT 'press-release')
2. **Research workflow columns** - Added to assignments (completed_at, feedback, revision_type, returned_by, clarification fields, notes)
3. **verification_notes** - Added to opposition_research table
4. **structured_data (JSON-LD)** - Added to all content tables
5. **Enhanced user columns** - Added department, supervisor_id, security_clearance, access_restrictions, is_active, password security fields
6. **team_members** - Added to assignments and all content tables

All migrations check for column existence before attempting to add, ensuring idempotent schema updates.

## Database Files Location

- Main database: `./campaign.db` (configurable via `DATABASE_PATH` env var)
- Campaign settings: `./data/campaign-settings.db`
- App settings: `./data/app-settings.db`
- Assignments: `./data/assignments.db`

---

**Total Tables**: 66 tables across all databases

**Last Updated**: 2025-10-01
