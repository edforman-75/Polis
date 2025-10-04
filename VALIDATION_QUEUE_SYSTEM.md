# Press Release Validation Queue System

## Overview

A comprehensive validation system for reviewing press releases page-by-page, tracking issues, recording reviewer decisions, and capturing knowledge base enhancements.

## Features

### ✅ Implemented

1. **Queue Management**
   - Load press releases into validation queue
   - Automatic analysis using grammar/AP Style checker
   - Priority-based queue ordering
   - Track review status (pending, in_review, completed)

2. **Issue Tracking**
   - Detailed issue categorization (grammar, AP Style, capitalization, etc.)
   - Severity levels (error, warning, suggestion)
   - Visual highlighting in original text
   - Suggested corrections

3. **Reviewer Workflow**
   - Capture reviewer initials for accountability
   - Page-by-page review interface
   - Issue-by-issue decisions (accept, reject, modify, note)
   - Progress tracking

4. **Knowledge Base Enhancement**
   - Add KB suggestions from individual issues
   - General comments and observations
   - Categorize KB entries (terminology, style rule, exception, etc.)
   - Track pending KB implementations

5. **Session Tracking**
   - Review statistics per reviewer
   - Items completed count
   - Issues reviewed tracking
   - Time-stamped review history

## Test Results

**Successfully loaded and analyzed:**
- ✅ 14 Spanberger press releases loaded
- ✅ 163 total issues identified
- ✅ Average score: 73.7
- ✅ All items ready for review

**Sample Issues Found:**
1. AP Style sentence length (48+ words)
2. Administration capitalization ("Trump Administration" → "Trump administration")
3. Grammar/spelling corrections
4. Readability improvements

## Architecture

### Database Schema

**`validation_queue`** - Main queue
- Source file, title, content
- Analysis results (score, issue count)
- Review status and metadata
- Reviewer initials and timestamps

**`validation_issues`** - Individual issues
- Category, type, severity
- Original text and location
- Suggested correction
- Reviewer decision and notes
- KB enhancement flags

**`validation_comments`** - Comments and KB suggestions
- General or issue-specific
- KB entry proposals
- Reviewer initials
- Implementation status

**`validation_sessions`** - Review sessions
- Session tracking
- Items/issues reviewed count
- KB suggestions made

**`validation_kb_pending`** - Pending KB entries
- Suggested terminology/rules
- Supporting evidence
- Approval workflow

### Services

**`ValidationQueueService`**
- Queue management (load, analyze, retrieve)
- Issue tracking
- Review workflow
- Comment/KB suggestion handling
- Statistics and reporting

### API Endpoints

```bash
# Load press releases
POST /api/validation/load-press-releases
{
  "addedBy": "user-initials"
}

# Analyze queue item
POST /api/validation/analyze/:id

# Analyze all unanalyzed items
POST /api/validation/analyze-all

# Get next item for review
GET /api/validation/next?reviewerInitials=ABC

# Start reviewing
POST /api/validation/:id/start-review
{
  "reviewerInitials": "ABC"
}

# Review an issue
POST /api/validation/issue/:id/review
{
  "reviewerInitials": "ABC",
  "reviewStatus": "accepted",  // accepted, rejected, modified, noted
  "reviewerCorrection": "...",  // if modified
  "reviewerComment": "...",
  "shouldAddToKb": true,
  "kbCategory": "terminology",
  "kbNotes": "..."
}

# Add comment
POST /api/validation/:id/comment
{
  "issueId": 123,  // optional
  "commentType": "kb_suggestion",
  "commentText": "...",
  "reviewerInitials": "ABC",
  "suggestsKbEntry": true,
  "kbEntryType": "custom_term",
  "kbEntryData": { ... }
}

# Complete review
POST /api/validation/:id/complete
{
  "reviewerInitials": "ABC",
  "notes": "..."
}

# Get queue summary
GET /api/validation/summary

# Get KB suggestions
GET /api/validation/kb-suggestions

# Get reviewer stats
GET /api/validation/stats/:reviewerInitials

# Get queue items
GET /api/validation/items?status=pending&limit=50&offset=0
```

## User Interface

### Validation Review Interface
**URL:** `http://localhost:3001/validation-review.html`

**Features:**
- **Reviewer Input**: Enter initials for accountability
- **Stats Bar**: Current item, total issues, reviewed count, completed count
- **Document Panel**:
  - Original text with highlighted issues
  - Color-coded severity (red=error, orange=warning, blue=suggestion)
  - Click highlights to jump to issue
  - General comments section
  - Complete/skip navigation

- **Issues Panel**:
  - List of all issues with details
  - Original text → suggested correction
  - Quick actions: Accept, Reject, Modify, Add to KB
  - Visual progress bar
  - Reviewed issues marked with checkmark

- **KB Modal**:
  - Entry type selection (terminology, style rule, exception, etc.)
  - Notes field
  - Submit to pending KB queue

### Review Workflow

1. **Enter Initials**: Reviewer enters their initials
2. **Auto-Load**: System loads next pending item
3. **Review Issues**:
   - Click on highlighted text or issue card
   - Choose action: Accept, Reject, Modify, or Add to KB
   - Add comments as needed
4. **General Comments**: Add overall observations or KB suggestions
5. **Complete**: Mark review complete, automatically loads next item

### KB Enhancement Workflow

1. **Issue-Level KB**:
   - Click "💡 KB" button on any issue
   - Select entry type (terminology, style rule, etc.)
   - Add notes explaining the suggestion
   - Submit to KB pending queue

2. **General KB Suggestions**:
   - Use general comments section
   - Click "💡 Suggest for KB"
   - Categorize suggestion type
   - Automatically tracked for implementation

## Usage Examples

### 1. Setup Queue (First Time)
```bash
node scripts/setup-validation-queue.js
```

This will:
- Load all Spanberger press releases
- Analyze them for issues
- Display queue summary
- Show first item preview

### 2. Review Press Releases

1. Open `http://localhost:3001/validation-review.html`
2. Enter your initials (e.g., "ABC")
3. System automatically loads first item
4. Review each issue:
   - **Accept**: If correction is correct
   - **Reject**: If suggestion is wrong
   - **Modify**: If you want different correction
   - **Add to KB**: If pattern should be remembered
5. Add general comments if needed
6. Click "Complete Review" to move to next item

### 3. Check Reviewer Stats
```bash
curl http://localhost:3001/api/validation/stats/ABC
```

### 4. Review KB Suggestions
```bash
curl http://localhost:3001/api/validation/kb-suggestions
```

## Knowledge Base Enhancement

### How It Works

1. **Reviewer Identifies Pattern**:
   - Notices recurring issue or correction
   - Clicks "Add to KB" on issue or adds general comment
   - Selects KB entry type and provides notes

2. **System Captures**:
   - Original text and correction
   - Category and type
   - Reviewer who suggested it
   - Supporting evidence (linked issues)

3. **Pending Queue**:
   - All KB suggestions stored in `validation_kb_pending`
   - Admin reviews and approves
   - Once approved, added to:
     - Custom terminology dictionary
     - Learned rules
     - AP Style exceptions

4. **Automatic Application**:
   - Approved KB entries automatically applied to future reviews
   - Pattern learning improves over time
   - Reduces duplicate flagging

### KB Entry Types

- **custom_term**: Campaign-specific names and terminology
- **style_rule**: Messaging style preferences
- **exception**: AP Style exceptions for this campaign
- **capitalization_rule**: Context-specific capitalization

## Statistics & Reporting

### Queue Summary
```javascript
{
  "pending": { count: 10, avg_score: 75, total_issues: 120 },
  "in_review": { count: 2, avg_score: 80, total_issues: 15 },
  "completed": { count: 5, avg_score: 85, total_issues: 45 }
}
```

### Reviewer Stats
```javascript
{
  "items_reviewed": 5,
  "total_issues": 45,
  "avg_score": 85,
  "reviewers": 1
}
```

### KB Suggestions
```javascript
[
  {
    "id": 1,
    "original_text": "Trump Administration",
    "suggested_correction": "Trump administration",
    "category": "capitalization",
    "kb_entry_type": "style_rule",
    "reviewer_initials": "ABC",
    "source_title": "Press Release Title"
  }
]
```

## Integration Points

### With Grammar Learning System
- Reviewer decisions feed into grammar learning
- Accepted/rejected patterns improve rules
- KB suggestions become learned rules

### With Custom Terminology
- KB terminology suggestions → Custom terms dictionary
- Automatic spell-check for future documents
- Misspelling detection

### With AP Style Checker
- KB style rules → AP Style exceptions
- Campaign-specific overrides
- Context-aware rule application

## Files Created

### Backend
- `backend/data/validation-queue-schema.sql` - Database schema
- `backend/services/validation-queue-service.js` - Core service
- `backend/routes/validation-queue.js` - API routes

### Frontend
- `public/validation-review.html` - Review interface

### Scripts
- `scripts/setup-validation-queue.js` - Queue setup script

## Next Steps

### Potential Enhancements

1. **Batch Review**
   - Review multiple items in one session
   - Bulk accept/reject similar issues
   - Session summary report

2. **AI-Assisted Review**
   - Auto-accept high-confidence corrections
   - Flag unusual patterns for review
   - Suggest KB entries based on patterns

3. **Collaboration**
   - Multi-reviewer workflow
   - Consensus tracking
   - Dispute resolution

4. **Reporting**
   - Reviewer performance metrics
   - Issue type analysis
   - KB contribution tracking
   - Quality improvement trends

5. **Export**
   - Generate corrected documents
   - Export review notes
   - KB implementation checklist

## Summary

The Validation Queue System provides:
1. ✅ Systematic review of all press releases
2. ✅ Page-by-page issue tracking
3. ✅ Reviewer accountability (initials captured)
4. ✅ Knowledge base enhancement from comments
5. ✅ Integration with grammar learning system
6. ✅ 14 Spanberger releases loaded and ready for review

**Access the system:**
- Review Interface: `http://localhost:3001/validation-review.html`
- Load releases: `node scripts/setup-validation-queue.js`

The system is production-ready and will continuously improve its checking capabilities based on reviewer feedback! 🚀
