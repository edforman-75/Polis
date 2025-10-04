-- Workflow & Collaboration System Schema
-- Supports multi-user approval workflows, content calendar, version control, and team collaboration

-- ============================================================================
-- USER MANAGEMENT & ROLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'communications_director', 'writer', 'editor', 'reviewer', 'approver')),
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
  preferences TEXT, -- JSON: notification settings, UI preferences
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  permission_type TEXT NOT NULL, -- 'create', 'edit', 'review', 'approve', 'publish', 'delete'
  resource_type TEXT NOT NULL, -- 'press_release', 'speech', 'social_post', 'policy_brief', etc.
  granted_by INTEGER,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (granted_by) REFERENCES users(id)
);

-- ============================================================================
-- APPROVAL WORKFLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL, -- 'press_release', 'speech', etc.
  is_default BOOLEAN DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS workflow_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  stage_order INTEGER NOT NULL,
  stage_name TEXT NOT NULL, -- 'Draft', 'Content Review', 'Legal Review', 'Final Approval'
  stage_type TEXT NOT NULL CHECK(stage_type IN ('creation', 'review', 'approval', 'compliance', 'publication')),
  required_role TEXT, -- Required role to complete this stage
  auto_advance BOOLEAN DEFAULT 0, -- Auto-advance if conditions met
  parallel_review BOOLEAN DEFAULT 0, -- Multiple reviewers can work simultaneously
  min_approvals INTEGER DEFAULT 1, -- Minimum approvals needed
  FOREIGN KEY (template_id) REFERENCES workflow_templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  content_id INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  current_stage_id INTEGER,
  status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'cancelled', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
  initiated_by INTEGER NOT NULL,
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  due_date TIMESTAMP,
  metadata TEXT, -- JSON: additional workflow context
  FOREIGN KEY (template_id) REFERENCES workflow_templates(id),
  FOREIGN KEY (current_stage_id) REFERENCES workflow_stages(id),
  FOREIGN KEY (initiated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS workflow_stage_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_instance_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  assigned_user_id INTEGER NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  action_taken TEXT, -- 'approved', 'rejected', 'requested_changes'
  notes TEXT,
  FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- ============================================================================
-- CONTENT CALENDAR & SCHEDULING
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK(event_type IN ('content_deadline', 'publication', 'review_meeting', 'approval_deadline', 'event', 'milestone')),
  content_id INTEGER,
  content_type TEXT,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP,
  all_day BOOLEAN DEFAULT 0,
  location TEXT,
  organizer_id INTEGER NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
  reminder_sent BOOLEAN DEFAULT 0,
  metadata TEXT, -- JSON: additional event details
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS calendar_attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'attendee' CHECK(role IN ('organizer', 'required', 'optional', 'reviewer', 'approver')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'tentative')),
  notified BOOLEAN DEFAULT 0,
  notified_at TIMESTAMP,
  responded_at TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS content_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  scheduled_by INTEGER NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'published', 'cancelled', 'failed')),
  publish_channel TEXT, -- 'website', 'social_media', 'email', 'press_distribution'
  published_at TIMESTAMP,
  published_by INTEGER,
  cancellation_reason TEXT,
  metadata TEXT, -- JSON: channel-specific settings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scheduled_by) REFERENCES users(id),
  FOREIGN KEY (published_by) REFERENCES users(id)
);

-- ============================================================================
-- VERSION CONTROL
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  content_hash TEXT, -- SHA-256 hash for change detection
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_summary TEXT,
  is_major_version BOOLEAN DEFAULT 0, -- Major vs minor version
  tags TEXT, -- JSON array: version tags
  metadata TEXT, -- JSON: additional version metadata
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE(content_id, content_type, version_number)
);

CREATE TABLE IF NOT EXISTS version_comparisons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_from_id INTEGER NOT NULL,
  version_to_id INTEGER NOT NULL,
  diff_data TEXT NOT NULL, -- JSON: detailed diff information
  comparison_type TEXT DEFAULT 'full' CHECK(comparison_type IN ('full', 'structural', 'text_only')),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by INTEGER,
  FOREIGN KEY (version_from_id) REFERENCES document_versions(id),
  FOREIGN KEY (version_to_id) REFERENCES document_versions(id),
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- ============================================================================
-- TEAM COLLABORATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  parent_comment_id INTEGER, -- For threaded comments
  author_id INTEGER NOT NULL,
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general' CHECK(comment_type IN ('general', 'suggestion', 'question', 'approval', 'rejection', 'change_request')),
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'resolved', 'archived')),
  resolved_by INTEGER,
  resolved_at TIMESTAMP,
  position_start INTEGER, -- Character position in document (optional)
  position_end INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited BOOLEAN DEFAULT 0,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comment_mentions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  mentioned_user_id INTEGER NOT NULL,
  notified BOOLEAN DEFAULT 0,
  notified_at TIMESTAMP,
  read BOOLEAN DEFAULT 0,
  read_at TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (mentioned_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comment_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reaction_type TEXT NOT NULL, -- 'like', 'agree', 'disagree', 'helpful'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(comment_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL, -- 'mention', 'assignment', 'approval_request', 'comment', 'deadline'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  related_content_id INTEGER,
  related_content_type TEXT,
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('critical', 'high', 'normal', 'low')),
  read BOOLEAN DEFAULT 0,
  read_at TIMESTAMP,
  sent_email BOOLEAN DEFAULT 0,
  sent_email_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'created', 'edited', 'approved', 'rejected', 'commented', 'mentioned'
  content_id INTEGER,
  content_type TEXT,
  description TEXT NOT NULL,
  metadata TEXT, -- JSON: additional activity details
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- TASK MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'general' CHECK(task_type IN ('general', 'review', 'approval', 'edit', 'research', 'writing')),
  content_id INTEGER,
  content_type TEXT,
  assigned_to INTEGER NOT NULL,
  assigned_by INTEGER NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
  due_date TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_hours REAL,
  actual_hours REAL,
  completion_notes TEXT,
  blocked_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  depends_on_task_id INTEGER NOT NULL,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK(dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_content ON workflow_instances(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_datetime ON calendar_events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_document_versions_content ON document_versions(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_document_versions_version ON document_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ============================================================================
-- SAMPLE DATA (Development)
-- ============================================================================

-- Insert sample users
INSERT OR IGNORE INTO users (id, username, email, full_name, role, department) VALUES
(1, 'admin', 'admin@campaign.com', 'Campaign Admin', 'admin', 'Leadership'),
(2, 'comm_dir', 'director@campaign.com', 'Communications Director', 'communications_director', 'Communications'),
(3, 'writer1', 'writer1@campaign.com', 'Sarah Writer', 'writer', 'Communications'),
(4, 'editor1', 'editor1@campaign.com', 'Mike Editor', 'editor', 'Communications'),
(5, 'reviewer1', 'reviewer1@campaign.com', 'Jane Reviewer', 'reviewer', 'Legal'),
(6, 'approver1', 'approver1@campaign.com', 'Tom Approver', 'approver', 'Leadership');

-- Insert default workflow template
INSERT OR IGNORE INTO workflow_templates (id, name, description, content_type, is_default, created_by) VALUES
(1, 'Standard Press Release Workflow', 'Multi-stage approval workflow for press releases', 'press_release', 1, 1);

-- Insert workflow stages
INSERT OR IGNORE INTO workflow_stages (template_id, stage_order, stage_name, stage_type, required_role, min_approvals) VALUES
(1, 1, 'Draft Creation', 'creation', 'writer', 1),
(1, 2, 'Content Review', 'review', 'editor', 1),
(1, 3, 'Legal Review', 'compliance', 'reviewer', 1),
(1, 4, 'Final Approval', 'approval', 'approver', 1);
