-- Unified Validation Queue Schema
-- Handles ALL validators: Grammar, Compliance, Tone, Fact-Checking, etc.

-- ============================================================================
-- MAIN VALIDATION QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS unified_validation_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_file TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'press_release',

  -- Review tracking
  review_status TEXT DEFAULT 'pending' CHECK(review_status IN ('pending', 'in_review', 'completed', 'approved')),
  reviewer_initials TEXT,
  review_started_at TIMESTAMP,
  review_completed_at TIMESTAMP,

  -- Overall scores
  overall_score REAL,
  total_issues INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,

  -- Validator-specific scores (JSON)
  grammar_score REAL,
  compliance_score REAL,
  tone_score REAL,
  fact_check_score REAL,

  -- Validator completion tracking
  grammar_reviewed BOOLEAN DEFAULT 0,
  compliance_reviewed BOOLEAN DEFAULT 0,
  tone_reviewed BOOLEAN DEFAULT 0,
  fact_check_reviewed BOOLEAN DEFAULT 0,

  -- Metadata
  added_by TEXT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),

  -- Session tracking
  session_id TEXT,
  session_data TEXT -- JSON: review session info
);

-- ============================================================================
-- VALIDATOR RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_item_id INTEGER NOT NULL,
  validator_type TEXT NOT NULL, -- 'grammar', 'compliance', 'tone', 'fact_check'

  -- Analysis results
  score REAL,
  issues_found INTEGER DEFAULT 0,
  analysis_data TEXT, -- JSON: full analysis results

  -- Review status
  review_status TEXT DEFAULT 'pending' CHECK(review_status IN ('pending', 'in_review', 'completed')),
  reviewer_initials TEXT,
  reviewed_at TIMESTAMP,

  -- Timestamps
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (queue_item_id) REFERENCES unified_validation_queue(id) ON DELETE CASCADE
);

-- ============================================================================
-- ISSUES (ALL VALIDATORS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_issues_unified (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_item_id INTEGER NOT NULL,
  validator_type TEXT NOT NULL,
  result_id INTEGER,

  -- Issue details
  category TEXT NOT NULL, -- 'grammar', 'ap_style', 'capitalization', 'compliance', 'tone', 'fact'
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK(severity IN ('critical', 'error', 'warning', 'suggestion')),

  -- Location in document
  original_text TEXT,
  position_start INTEGER,
  position_end INTEGER,
  line_number INTEGER,

  -- Suggestion
  suggested_correction TEXT,
  explanation TEXT,

  -- Review decision
  review_status TEXT DEFAULT 'pending' CHECK(review_status IN ('pending', 'accepted', 'rejected', 'modified', 'noted')),
  reviewer_initials TEXT,
  reviewer_correction TEXT, -- If reviewer modified the suggestion
  reviewer_comment TEXT,
  reviewed_at TIMESTAMP,

  -- Knowledge base enhancement
  should_add_to_kb BOOLEAN DEFAULT 0,
  kb_category TEXT, -- 'terminology', 'style_rule', 'exception', 'compliance_rule'
  kb_notes TEXT,
  kb_added BOOLEAN DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (queue_item_id) REFERENCES unified_validation_queue(id) ON DELETE CASCADE,
  FOREIGN KEY (result_id) REFERENCES validation_results(id) ON DELETE CASCADE
);

-- ============================================================================
-- REVIEWER COMMENTS & KB SUGGESTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_comments_unified (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_item_id INTEGER NOT NULL,
  validator_type TEXT,
  issue_id INTEGER, -- NULL for general comments

  comment_type TEXT DEFAULT 'general' CHECK(comment_type IN ('general', 'kb_suggestion', 'concern', 'approval_note')),
  comment_text TEXT NOT NULL,

  reviewer_initials TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- KB enhancement
  suggests_kb_entry BOOLEAN DEFAULT 0,
  kb_entry_type TEXT,
  kb_entry_data TEXT, -- JSON
  kb_implemented BOOLEAN DEFAULT 0,

  FOREIGN KEY (queue_item_id) REFERENCES unified_validation_queue(id) ON DELETE CASCADE,
  FOREIGN KEY (issue_id) REFERENCES validation_issues_unified(id) ON DELETE CASCADE
);

-- ============================================================================
-- KNOWLEDGE BASE PENDING ENHANCEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_pending_enhancements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  validator_type TEXT NOT NULL,
  enhancement_type TEXT NOT NULL, -- 'custom_term', 'style_rule', 'compliance_rule', 'tone_profile', 'fact_pattern'

  -- Enhancement data
  original_text TEXT,
  suggested_correction TEXT,
  rule_description TEXT,

  category TEXT,
  subcategory TEXT,

  -- Supporting evidence
  source_queue_item_id INTEGER,
  source_issue_id INTEGER,
  supporting_examples TEXT, -- JSON: array of examples

  -- Approval workflow
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'implemented')),
  suggested_by TEXT NOT NULL,
  suggested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  implemented_at TIMESTAMP,

  -- Implementation data
  implementation_notes TEXT,
  rule_id TEXT, -- ID in the target KB

  FOREIGN KEY (source_queue_item_id) REFERENCES unified_validation_queue(id),
  FOREIGN KEY (source_issue_id) REFERENCES validation_issues_unified(id)
);

-- ============================================================================
-- REVIEWER SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_sessions_unified (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  reviewer_initials TEXT NOT NULL,

  -- Session stats
  items_reviewed INTEGER DEFAULT 0,
  issues_reviewed INTEGER DEFAULT 0,
  issues_accepted INTEGER DEFAULT 0,
  issues_rejected INTEGER DEFAULT 0,
  issues_modified INTEGER DEFAULT 0,
  kb_suggestions_made INTEGER DEFAULT 0,

  -- Validator breakdowns
  grammar_items_reviewed INTEGER DEFAULT 0,
  compliance_items_reviewed INTEGER DEFAULT 0,
  tone_items_reviewed INTEGER DEFAULT 0,
  fact_check_items_reviewed INTEGER DEFAULT 0,

  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- ============================================================================
-- EDITS & CORRECTIONS APPLIED
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_item_id INTEGER NOT NULL,
  issue_id INTEGER,

  edit_type TEXT NOT NULL, -- 'correction', 'addition', 'deletion', 'replacement'

  -- Edit location
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,

  -- Edit content
  original_text TEXT NOT NULL,
  new_text TEXT NOT NULL,

  -- Attribution
  applied_by TEXT NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  from_validator TEXT,
  auto_applied BOOLEAN DEFAULT 0, -- If automatically applied from KB

  FOREIGN KEY (queue_item_id) REFERENCES unified_validation_queue(id) ON DELETE CASCADE,
  FOREIGN KEY (issue_id) REFERENCES validation_issues_unified(id)
);

-- ============================================================================
-- CORRECTED DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_corrected_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_item_id INTEGER NOT NULL,

  -- Versions
  original_content TEXT NOT NULL,
  corrected_content TEXT NOT NULL,

  -- Edit summary
  total_edits INTEGER DEFAULT 0,
  grammar_edits INTEGER DEFAULT 0,
  compliance_edits INTEGER DEFAULT 0,
  tone_edits INTEGER DEFAULT 0,
  fact_edits INTEGER DEFAULT 0,

  -- Final scores
  final_grammar_score REAL,
  final_compliance_score REAL,
  final_tone_score REAL,
  final_fact_check_score REAL,
  final_overall_score REAL,

  -- Attribution
  finalized_by TEXT NOT NULL,
  finalized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Export
  exported BOOLEAN DEFAULT 0,
  export_format TEXT,
  exported_at TIMESTAMP,

  FOREIGN KEY (queue_item_id) REFERENCES unified_validation_queue(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_unified_queue_status ON unified_validation_queue(review_status);
CREATE INDEX IF NOT EXISTS idx_unified_queue_reviewer ON unified_validation_queue(reviewer_initials);
CREATE INDEX IF NOT EXISTS idx_unified_queue_priority ON unified_validation_queue(priority, review_status);

CREATE INDEX IF NOT EXISTS idx_validation_results_queue ON validation_results(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_validator ON validation_results(validator_type);
CREATE INDEX IF NOT EXISTS idx_validation_results_status ON validation_results(review_status);

CREATE INDEX IF NOT EXISTS idx_issues_unified_queue ON validation_issues_unified(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_issues_unified_validator ON validation_issues_unified(validator_type);
CREATE INDEX IF NOT EXISTS idx_issues_unified_status ON validation_issues_unified(review_status);
CREATE INDEX IF NOT EXISTS idx_issues_unified_severity ON validation_issues_unified(severity);

CREATE INDEX IF NOT EXISTS idx_kb_pending_validator ON kb_pending_enhancements(validator_type);
CREATE INDEX IF NOT EXISTS idx_kb_pending_status ON kb_pending_enhancements(status);

CREATE INDEX IF NOT EXISTS idx_sessions_reviewer ON validation_sessions_unified(reviewer_initials);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON validation_sessions_unified(session_id);

CREATE INDEX IF NOT EXISTS idx_edits_queue ON validation_edits(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_edits_validator ON validation_edits(from_validator);
