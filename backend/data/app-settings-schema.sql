-- Application Settings Schema
-- Parser and Editor settings with granular control
-- Singleton pattern - only one row of settings

-- Parser Settings
CREATE TABLE IF NOT EXISTS parser_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Singleton

    -- Context Extraction
    auto_extract_context BOOLEAN DEFAULT 0,
    validate_against_campaign_settings BOOLEAN DEFAULT 1,
    context_confidence_threshold REAL DEFAULT 0.7,

    -- Field Extraction
    extract_quotes BOOLEAN DEFAULT 1,
    extract_contact_info BOOLEAN DEFAULT 1,
    extract_boilerplate BOOLEAN DEFAULT 1,
    extract_dates BOOLEAN DEFAULT 1,
    extract_locations BOOLEAN DEFAULT 1,

    -- Quote Detection
    min_quote_words INTEGER DEFAULT 5,
    max_quote_words INTEGER DEFAULT 100,
    detect_quote_attribution BOOLEAN DEFAULT 1,

    -- Boilerplate Detection
    auto_detect_boilerplate BOOLEAN DEFAULT 1,
    use_campaign_boilerplate BOOLEAN DEFAULT 1,
    boilerplate_similarity_threshold REAL DEFAULT 0.8,

    -- Text Cleanup
    remove_excess_whitespace BOOLEAN DEFAULT 1,
    normalize_line_breaks BOOLEAN DEFAULT 1,
    fix_common_typos BOOLEAN DEFAULT 0,

    -- Field Assignment
    confidence_threshold REAL DEFAULT 0.5,
    field_movement_detection BOOLEAN DEFAULT 1,

    -- Performance
    max_tokens_per_request INTEGER DEFAULT 4000,
    temperature REAL DEFAULT 0.1,
    use_cache BOOLEAN DEFAULT 1,

    -- Updated timestamp
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Editor Settings
CREATE TABLE IF NOT EXISTS editor_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Singleton

    -- AI Assistance Level
    ai_assistance_level TEXT DEFAULT 'balanced', -- minimal, balanced, aggressive
    auto_apply_high_confidence BOOLEAN DEFAULT 0,
    high_confidence_threshold REAL DEFAULT 0.9,

    -- Quality Checks (can be toggled individually)
    enable_quality_checks BOOLEAN DEFAULT 1,

    -- AP Style Checks
    check_ap_style BOOLEAN DEFAULT 1,
    check_ap_dates BOOLEAN DEFAULT 1,
    check_ap_states BOOLEAN DEFAULT 1,
    check_ap_titles BOOLEAN DEFAULT 1,
    check_ap_numbers BOOLEAN DEFAULT 1,
    check_ap_abbreviations BOOLEAN DEFAULT 1,
    check_ap_punctuation BOOLEAN DEFAULT 1,

    -- Grammar & Spelling
    check_grammar BOOLEAN DEFAULT 1,
    check_spelling BOOLEAN DEFAULT 1,
    check_punctuation BOOLEAN DEFAULT 1,
    check_sentence_structure BOOLEAN DEFAULT 1,

    -- Voice & Tone
    check_voice_consistency BOOLEAN DEFAULT 1,
    check_tone_appropriateness BOOLEAN DEFAULT 1,
    check_reading_level BOOLEAN DEFAULT 1,
    target_reading_level INTEGER DEFAULT 10, -- Grade level

    -- Content Enhancement
    suggest_prose_improvements BOOLEAN DEFAULT 1,
    suggest_stronger_verbs BOOLEAN DEFAULT 1,
    suggest_quote_improvements BOOLEAN DEFAULT 1,
    suggest_headline_alternatives BOOLEAN DEFAULT 1,
    check_redundancy BOOLEAN DEFAULT 1,
    check_wordiness BOOLEAN DEFAULT 1,

    -- Political Content
    check_fact_consistency BOOLEAN DEFAULT 1,
    flag_unsupported_claims BOOLEAN DEFAULT 1,
    check_opponent_mentions BOOLEAN DEFAULT 1,
    check_sensitive_language BOOLEAN DEFAULT 1,

    -- SEO & Distribution
    check_seo_optimization BOOLEAN DEFAULT 1,
    check_social_media_friendly BOOLEAN DEFAULT 1,
    suggest_pull_quotes BOOLEAN DEFAULT 1,

    -- Formatting
    check_formatting_consistency BOOLEAN DEFAULT 1,
    enforce_style_guide BOOLEAN DEFAULT 1,
    check_link_validity BOOLEAN DEFAULT 0,

    -- Track Changes
    track_all_changes BOOLEAN DEFAULT 1,
    show_change_rationale BOOLEAN DEFAULT 1,
    require_approval_for_major_changes BOOLEAN DEFAULT 1,

    -- Auto-save & Versioning
    auto_save_enabled BOOLEAN DEFAULT 1,
    auto_save_interval INTEGER DEFAULT 30, -- seconds
    keep_version_history BOOLEAN DEFAULT 1,
    max_versions_to_keep INTEGER DEFAULT 10,

    -- Notifications
    notify_on_low_quality BOOLEAN DEFAULT 1,
    notify_on_potential_issues BOOLEAN DEFAULT 1,
    quality_threshold REAL DEFAULT 3.5, -- 1-5 scale

    -- Performance
    real_time_suggestions BOOLEAN DEFAULT 1,
    debounce_delay INTEGER DEFAULT 500, -- milliseconds
    max_suggestions_per_field INTEGER DEFAULT 5,

    -- Suggestions Display
    suggestions_sort_order TEXT DEFAULT 'severity', -- severity, field-order, category, confidence, alphabetical
    group_suggestions_by TEXT DEFAULT 'category',   -- category, field, severity, none
    show_accepted_suggestions BOOLEAN DEFAULT 0,    -- Show recently accepted in grayed out state
    auto_scroll_to_suggestion BOOLEAN DEFAULT 1,    -- Auto-scroll to suggestion when clicking field
    collapse_low_priority BOOLEAN DEFAULT 1,        -- Auto-collapse enhancement suggestions

    -- Suggestion Filtering
    show_suggestions_inline BOOLEAN DEFAULT 1,      -- Show underlines in fields
    show_suggestions_panel BOOLEAN DEFAULT 1,       -- Show in right panel
    min_confidence_to_show REAL DEFAULT 0.5,        -- Don't show suggestions below this confidence

    -- Updated timestamp
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual Edit Check Configurations
CREATE TABLE IF NOT EXISTS edit_check_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    check_category TEXT NOT NULL,           -- ap-style, grammar, voice, enhancement, political, seo
    check_name TEXT NOT NULL UNIQUE,        -- e.g., "ap-style-dates", "grammar-passive-voice"
    check_display_name TEXT NOT NULL,
    check_description TEXT,
    enabled BOOLEAN DEFAULT 1,
    severity TEXT DEFAULT 'warning',        -- error, warning, suggestion
    auto_fix BOOLEAN DEFAULT 0,             -- Can this be auto-fixed?
    confidence_required REAL DEFAULT 0.8,   -- Confidence needed to show suggestion
    examples TEXT,                          -- JSON array of examples
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parser Field Configurations
CREATE TABLE IF NOT EXISTS parser_field_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_name TEXT NOT NULL UNIQUE,
    field_display_name TEXT NOT NULL,
    field_description TEXT,
    enabled BOOLEAN DEFAULT 1,
    required BOOLEAN DEFAULT 0,
    min_confidence REAL DEFAULT 0.5,
    validation_rules TEXT,                  -- JSON validation rules
    extraction_hints TEXT,                  -- Hints for better extraction
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Triggers to update timestamps
CREATE TRIGGER IF NOT EXISTS update_parser_settings_timestamp
AFTER UPDATE ON parser_settings
BEGIN
    UPDATE parser_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS update_editor_settings_timestamp
AFTER UPDATE ON editor_settings
BEGIN
    UPDATE editor_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS update_edit_check_config_timestamp
AFTER UPDATE ON edit_check_config
BEGIN
    UPDATE edit_check_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert default settings
INSERT OR IGNORE INTO parser_settings (id) VALUES (1);
INSERT OR IGNORE INTO editor_settings (id) VALUES (1);

-- Insert default edit checks
INSERT OR IGNORE INTO edit_check_config (check_category, check_name, check_display_name, check_description, severity) VALUES
-- AP Style Checks
('ap-style', 'ap-style-dates', 'Date Format', 'Check dates follow AP Style (e.g., Jan. 15, 2024)', 'warning'),
('ap-style', 'ap-style-states', 'State Abbreviations', 'Check state abbreviations follow AP Style', 'warning'),
('ap-style', 'ap-style-titles', 'Title Format', 'Check titles are formatted per AP Style', 'warning'),
('ap-style', 'ap-style-numbers', 'Number Style', 'Check numbers follow AP Style (spell out one-nine)', 'warning'),
('ap-style', 'ap-style-time', 'Time Format', 'Check time follows AP Style (e.g., 3 p.m.)', 'warning'),

-- Grammar Checks
('grammar', 'grammar-passive-voice', 'Passive Voice', 'Detect and suggest active voice alternatives', 'suggestion'),
('grammar', 'grammar-subject-verb', 'Subject-Verb Agreement', 'Check subject-verb agreement', 'error'),
('grammar', 'grammar-comma-splice', 'Comma Splices', 'Detect comma splices', 'error'),
('grammar', 'grammar-sentence-fragments', 'Sentence Fragments', 'Detect incomplete sentences', 'error'),

-- Voice & Tone
('voice', 'voice-consistency', 'Voice Consistency', 'Check consistency with campaign voice', 'warning'),
('voice', 'voice-reading-level', 'Reading Level', 'Check reading level is appropriate', 'suggestion'),
('voice', 'voice-tone', 'Tone Appropriateness', 'Check tone matches campaign guidelines', 'suggestion'),

-- Content Enhancement
('enhancement', 'enhancement-weak-verbs', 'Weak Verbs', 'Suggest stronger action verbs', 'suggestion'),
('enhancement', 'enhancement-redundancy', 'Redundancy', 'Detect redundant phrases', 'suggestion'),
('enhancement', 'enhancement-wordiness', 'Wordiness', 'Suggest more concise alternatives', 'suggestion'),
('enhancement', 'enhancement-cliches', 'Clichés', 'Flag overused phrases', 'suggestion'),

-- Political Content
('political', 'political-facts', 'Fact Consistency', 'Check claims for consistency', 'warning'),
('political', 'political-claims', 'Unsupported Claims', 'Flag claims without support', 'warning'),
('political', 'political-sensitive', 'Sensitive Language', 'Check for potentially problematic language', 'warning'),

-- SEO & Distribution
('seo', 'seo-headline-length', 'Headline Length', 'Check headline is optimal for SEO', 'suggestion'),
('seo', 'seo-keyword-density', 'Keyword Density', 'Check key terms are mentioned', 'suggestion'),
('seo', 'seo-meta-description', 'Meta Description', 'Suggest meta description', 'suggestion');

-- Insert default parser field configurations
INSERT OR IGNORE INTO parser_field_config (field_name, field_display_name, field_description, required) VALUES
('headline', 'Headline', 'Main headline of the press release', 1),
('subheadline', 'Subheadline', 'Secondary headline or deck', 0),
('dateline', 'Dateline', 'Location and date (e.g., WASHINGTON, DC - Jan 15, 2024)', 1),
('lead_paragraph', 'Lead Paragraph', 'Opening paragraph with key information', 1),
('body_text', 'Body Text', 'Main content paragraphs', 1),
('quote_1', 'Primary Quote', 'Main quote from candidate or spokesperson', 0),
('quote_1_attribution', 'Quote 1 Attribution', 'Who said quote 1', 0),
('quote_2', 'Secondary Quote', 'Second quote if applicable', 0),
('quote_2_attribution', 'Quote 2 Attribution', 'Who said quote 2', 0),
('boilerplate', 'Boilerplate', 'Standard campaign bio', 1),
('contact_name', 'Contact Name', 'Press contact name', 0),
('contact_title', 'Contact Title', 'Press contact title', 0),
('contact_email', 'Contact Email', 'Press contact email', 0),
('contact_phone', 'Contact Phone', 'Press contact phone', 0);
