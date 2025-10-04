-- Grammar & AP Style Learning System Schema
-- Captures user feedback to enhance rules over time

-- User Feedback on Grammar/Style Suggestions
CREATE TABLE IF NOT EXISTS grammar_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- What was flagged
    rule_id TEXT NOT NULL,                    -- e.g., 'ap_percent', 'cap_democratic_party'
    category TEXT NOT NULL,                   -- grammar, ap_style, capitalization, campaign_style, clarity
    issue_type TEXT NOT NULL,                 -- specific type within category

    -- Context
    original_text TEXT NOT NULL,              -- Text that was flagged
    suggested_correction TEXT,                -- What we suggested
    context_before TEXT,                      -- 50 chars before
    context_after TEXT,                       -- 50 chars after
    full_sentence TEXT,                       -- The complete sentence

    -- User action
    user_action TEXT NOT NULL,                -- accepted, rejected, modified, ignored
    user_correction TEXT,                     -- If they modified it, what they used
    user_comment TEXT,                        -- Optional user explanation

    -- Metadata
    content_id INTEGER,                       -- Link to content if available
    user_id TEXT,                             -- Who made the decision
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- For pattern learning
    pattern_hash TEXT,                        -- Hash of the pattern for grouping similar cases

    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE SET NULL
);

-- Learned Rules from Feedback
CREATE TABLE IF NOT EXISTS learned_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Rule identity
    rule_type TEXT NOT NULL,                  -- pattern, exception, correction, terminology
    category TEXT NOT NULL,                   -- grammar, ap_style, capitalization, etc.

    -- Pattern
    pattern TEXT NOT NULL,                    -- Regex or text pattern
    pattern_type TEXT DEFAULT 'regex',        -- regex, exact, fuzzy

    -- What to do
    action TEXT NOT NULL,                     -- flag, ignore, auto_correct, suggest
    correction TEXT,                          -- Suggested correction if applicable
    message TEXT,                             -- Message to show user
    severity TEXT DEFAULT 'suggestion',       -- error, warning, suggestion

    -- Confidence & Learning
    confidence REAL DEFAULT 0.5,              -- 0-1, how confident we are in this rule
    support_count INTEGER DEFAULT 1,          -- How many times accepted
    reject_count INTEGER DEFAULT 0,           -- How many times rejected

    -- Rule metadata
    learned_from TEXT,                        -- 'user_feedback', 'manual', 'imported'
    source_feedback_ids TEXT,                 -- JSON array of feedback IDs that created this
    examples TEXT,                            -- JSON array of examples

    -- Status
    status TEXT DEFAULT 'pending',            -- pending, approved, active, rejected, archived
    approved_by TEXT,                         -- Who approved it
    approved_at DATETIME,

    -- Tracking
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at DATETIME,
    trigger_count INTEGER DEFAULT 0,

    -- Notes
    notes TEXT
);

-- Pattern Performance Tracking
CREATE TABLE IF NOT EXISTS rule_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    rule_id INTEGER NOT NULL,
    learned_rule_id INTEGER,                  -- If it's a learned rule

    -- Performance metrics
    total_suggestions INTEGER DEFAULT 0,
    accepted_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    modified_count INTEGER DEFAULT 0,
    ignored_count INTEGER DEFAULT 0,

    -- Quality metrics
    acceptance_rate REAL,                     -- accepted / total
    precision REAL,                           -- accepted / (accepted + rejected)
    false_positive_rate REAL,                 -- rejected / total

    -- Time windows
    last_30_days_suggestions INTEGER DEFAULT 0,
    last_30_days_accepted INTEGER DEFAULT 0,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (learned_rule_id) REFERENCES learned_rules(id) ON DELETE CASCADE
);

-- Custom Terminology & Exceptions
CREATE TABLE IF NOT EXISTS custom_terminology (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Term
    term TEXT NOT NULL UNIQUE,
    correct_form TEXT NOT NULL,

    -- Context
    term_type TEXT,                           -- person_name, place_name, organization, program, acronym, jargon
    category TEXT,                            -- political, campaign_specific, local, policy

    -- Usage rules
    capitalization_rule TEXT,                 -- always_capitalize, context_dependent, lowercase
    context_patterns TEXT,                    -- JSON: when to apply this rule

    -- Variations
    common_misspellings TEXT,                 -- JSON array of common mistakes
    acceptable_variations TEXT,               -- JSON array of acceptable alternates

    -- Source
    source TEXT DEFAULT 'manual',             -- manual, learned, imported
    confidence REAL DEFAULT 1.0,

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AP Style Exceptions (campaign-specific overrides)
CREATE TABLE IF NOT EXISTS ap_style_exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- What rule to override
    base_rule_id TEXT NOT NULL,               -- The AP rule being overridden
    base_rule_name TEXT NOT NULL,

    -- Exception pattern
    exception_pattern TEXT NOT NULL,          -- When this exception applies
    exception_reason TEXT,                    -- Why we make this exception

    -- Override behavior
    override_action TEXT NOT NULL,            -- ignore, modify_message, custom_correction
    custom_message TEXT,
    custom_correction TEXT,

    -- Campaign context
    campaign_specific BOOLEAN DEFAULT 1,
    applies_to_content_types TEXT,           -- JSON array: press_release, social_media, email, etc.

    -- Approval
    approved_by TEXT,
    approved_at DATETIME,

    -- Status
    active BOOLEAN DEFAULT 1,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pattern Clusters (group similar feedback for pattern detection)
CREATE TABLE IF NOT EXISTS feedback_clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Cluster identity
    cluster_type TEXT NOT NULL,               -- similar_patterns, same_context, related_terms
    pattern_signature TEXT NOT NULL,          -- Hash/signature of the pattern

    -- Cluster metadata
    feedback_ids TEXT NOT NULL,               -- JSON array of feedback IDs in this cluster
    feedback_count INTEGER DEFAULT 0,

    -- Pattern analysis
    common_pattern TEXT,                      -- Extracted common pattern
    pattern_confidence REAL,                  -- How consistent is the pattern

    -- Actions
    acceptance_rate REAL,                     -- % accepted in this cluster
    suggested_rule TEXT,                      -- Proposed rule based on cluster

    -- Status
    status TEXT DEFAULT 'pending',            -- pending, reviewed, rule_created, dismissed
    reviewed_by TEXT,
    reviewed_at DATETIME,
    learned_rule_id INTEGER,                  -- Link to created rule if applicable

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (learned_rule_id) REFERENCES learned_rules(id) ON DELETE SET NULL
);

-- Rule Suggestions from AI Analysis
CREATE TABLE IF NOT EXISTS ai_rule_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- What pattern did AI detect?
    detected_pattern TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    category TEXT NOT NULL,

    -- Why suggest this?
    reasoning TEXT NOT NULL,
    supporting_examples TEXT,                 -- JSON array of examples
    feedback_cluster_id INTEGER,              -- Link to cluster if based on feedback

    -- Proposed rule
    proposed_rule TEXT NOT NULL,              -- JSON: complete rule definition
    proposed_message TEXT,
    proposed_correction TEXT,
    proposed_severity TEXT DEFAULT 'suggestion',

    -- Confidence
    confidence REAL,
    support_evidence_count INTEGER,

    -- Status
    status TEXT DEFAULT 'pending',            -- pending, approved, rejected, needs_review
    reviewed_by TEXT,
    reviewed_at DATETIME,
    review_notes TEXT,

    -- If approved
    learned_rule_id INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (feedback_cluster_id) REFERENCES feedback_clusters(id) ON DELETE SET NULL,
    FOREIGN KEY (learned_rule_id) REFERENCES learned_rules(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grammar_feedback_rule ON grammar_feedback(rule_id);
CREATE INDEX IF NOT EXISTS idx_grammar_feedback_pattern ON grammar_feedback(pattern_hash);
CREATE INDEX IF NOT EXISTS idx_grammar_feedback_action ON grammar_feedback(user_action);
CREATE INDEX IF NOT EXISTS idx_grammar_feedback_timestamp ON grammar_feedback(timestamp);

CREATE INDEX IF NOT EXISTS idx_learned_rules_category ON learned_rules(category);
CREATE INDEX IF NOT EXISTS idx_learned_rules_status ON learned_rules(status);
CREATE INDEX IF NOT EXISTS idx_learned_rules_confidence ON learned_rules(confidence);

CREATE INDEX IF NOT EXISTS idx_custom_terminology_term ON custom_terminology(term);
CREATE INDEX IF NOT EXISTS idx_custom_terminology_type ON custom_terminology(term_type);

CREATE INDEX IF NOT EXISTS idx_feedback_clusters_status ON feedback_clusters(status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_rule_suggestions(status);

-- Triggers
CREATE TRIGGER IF NOT EXISTS update_custom_terminology_timestamp
AFTER UPDATE ON custom_terminology
BEGIN
    UPDATE custom_terminology SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_ap_exceptions_timestamp
AFTER UPDATE ON ap_style_exceptions
BEGIN
    UPDATE ap_style_exceptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_rule_performance_timestamp
AFTER UPDATE ON rule_performance
BEGIN
    UPDATE rule_performance SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Initialize with known custom terminology
INSERT OR IGNORE INTO custom_terminology (term, correct_form, term_type, category, capitalization_rule, common_misspellings, source, confidence) VALUES
('Abigail Spanberger', 'Abigail Spanberger', 'person_name', 'campaign_specific', 'always_capitalize', '["Spanberg", "Spanburger", "Spamberger"]', 'manual', 1.0),
('Winsome Earle-Sears', 'Winsome Earle-Sears', 'person_name', 'political', 'always_capitalize', '["Earl-Sears", "Earle Sears", "Winsom"]', 'manual', 1.0),
('DOGE', 'DOGE', 'acronym', 'political', 'always_capitalize', '["Doge", "doge"]', 'manual', 1.0),
('Commonwealth', 'Commonwealth', 'place_name', 'local', 'context_dependent', '["commonwealth"]', 'manual', 1.0);
