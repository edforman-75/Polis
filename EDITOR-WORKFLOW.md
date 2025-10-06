# Polis Campaign Editor - Complete Workflow Guide

## 🚀 Quick Start

### For Editors:

1. **Start Here**: Navigate to `http://localhost:3001/editor-queue.html`
2. **Import a Document**: Click "Import New Document" button
3. **Work on It**: Click any document in the queue to edit
4. **Save & Repeat**: Changes auto-save every 30 seconds

---

## 📋 Editor Queue Dashboard

**URL**: `http://localhost:3001/editor-queue.html`

### Features:

#### Stats Overview
- **Drafts**: New documents not yet reviewed
- **Awaiting Research**: Documents with pending fact-check requests
- **Ready for Review**: Completed documents ready for approval
- **Total Documents**: All documents in the system

#### Document List Columns:
- **Document**: Headline and last modified time
- **Status**: Current workflow status with color coding
- **Priority**: Urgent, High, Normal, Low
- **Due Date**: Days until deadline (shows "Overdue" in red if past due)
- **Research**: Number of pending research requests (🔍 icon)
- **Last Modified**: Calendar date of last change

#### Filter Tabs:
- All
- Drafts
- Awaiting Research
- Ready for Review
- Approved

#### Actions:
- **Click any document row** → Opens in editor
- **Import New Document** → Upload .txt file or paste text

---

## ✍️ Unified Editor v2

**URL**: `http://localhost:3001/unified-editor-v2.html?docId={id}`

### Header Elements:

- **Status Badge**: Shows current status with pulsing animation for "Awaiting Research"
  - 📝 Draft
  - 🔍 Awaiting Research (count)
  - ✅ Ready for Review
  - 👍 Approved
  - 🚀 Published

- **Buttons**:
  - ◀️ Back to Queue
  - ⚙️ Preferences
  - 💾 Save (shows "✓ Saved" confirmation)
  - 📤 Export

### Left Panel: Document Editor

#### Two Views (Tabs):

1. **Full Document**
   - Edit the entire document as plain text
   - Changes sync to Section view automatically
   - Quality checks update after 1 second of no typing

2. **By Section**
   - **Sections displayed**:
     - 📰 Headline (unique)
     - 📝 Subhead (unique, optional)
     - 📅 Dateline (unique - location & date only)
     - 📰 Lead Paragraph (unique - text after dateline)
     - 💬 Quotes (multiple allowed)
       - Green = Candidate quote (editable)
       - Blue = Staff quote (editable)
       - Pink = Outsider quote (requires permission)
     - 📄 Body Paragraphs (multiple allowed)

   - **Section Actions** (⋮ menu on hover):
     - ⬆️ Insert Body Paragraph Before
     - ⬇️ Insert Body Paragraph After
     - ⬇️ Insert Quote After
     - *Note: Unique sections (headline, dateline, etc.) don't show menu*

### Right Panel: Quality Checks

#### Progress Summary:
- Blocking Issues (red) - Must fix before publishing
- Warnings (orange) - Should fix
- Tips (green) - Suggestions

#### Categories (Filter Tabs):
- All
- Legal
- Style

#### For Each Issue:

**Before/After View**:
- Shows original text with strikethrough
- Shows suggested replacement in green

**Action Buttons**:
- ✓ Apply - Accepts suggestion automatically
- ✎ Edit & Apply - Modify suggestion before applying
- ✕ Dismiss - Ignore this suggestion

**Special: Research-Required Issues**:
- When you click "Edit & Apply" on citations with placeholders like `[Poll Name, Date]`
- If you keep the brackets, the system:
  - Creates a research request
  - Changes document status to "Awaiting Research"
  - Shows count in status badge: "🔍 Awaiting Research (2)"

#### Resolved Issues Section (Bottom):
- Click header to expand/collapse
- Shows: "✓ Resolved Issues (5) - 3 fixed, 2 dismissed"
- Fixed issues = green badge
- Dismissed issues = gray badge

---

## 🔄 Complete Workflow Example

### Scenario: New Press Release

1. **Import** (`editor-queue.html`)
   - Click "Import New Document"
   - Paste press release text or upload .txt file
   - Click "Import & Edit"
   - → Opens in editor automatically

2. **Edit** (`unified-editor-v2.html`)
   - Document loads in Full Document view
   - Quality checks run automatically
   - Status badge shows "📝 Draft"

3. **Review Quality Checks**
   - See "Unsupported Claim - Needs Citation" warning
   - Shows: `According to recent polling...`
   - Suggestion: `According to [Poll Name, Date],...`

4. **Request Research**
   - Click "✎ Edit & Apply"
   - Keep the brackets: `[Poll Name, Date]`
   - Click OK
   - → Status changes to "🔍 Awaiting Research (1)"
   - → Badge pulses to draw attention

5. **Continue Editing**
   - Switch to "By Section" view
   - Edit quotes directly
   - Insert new body paragraphs with ⋮ menu
   - Changes auto-save every 30 seconds

6. **Fix Other Issues**
   - Apply grammar suggestions
   - Dismiss irrelevant warnings
   - Watch them slide away with animation
   - See them in "Resolved Issues" section

7. **Return to Queue**
   - Click ◀️ Back to Queue
   - Document now shows:
     - Status: "Awaiting Research"
     - Research: 🔍 1
     - Updated "Last Modified" time

8. **Later: Complete Research**
   - Someone fills in: `According to Quinnipiac Poll Oct 3, 2025,...`
   - Remove the brackets
   - Status can be changed to "Ready for Review"

---

## 💾 Data Storage

### LocalStorage Keys:
- `polisDocuments` - Array of all documents
- `editorPreferences` - User settings

### Document Object Structure:
```json
{
  "id": "doc-1234567890",
  "headline": "Smith Announces Weekend Canvass Launch...",
  "fullText": "Full document text...",
  "status": "awaiting-research",
  "priority": "high",
  "dueDate": "2025-10-15T00:00:00.000Z",
  "lastModified": "2025-10-06T15:30:00.000Z",
  "createdAt": "2025-10-06T10:00:00.000Z",
  "researchCount": 2
}
```

### Research Request Object:
```json
{
  "id": "research-1234567890",
  "query": "polling data on voter turnout 2025",
  "context": "According to [Poll Name, Date],...",
  "createdAt": "2025-10-06T15:30:00.000Z",
  "status": "pending",
  "relatedIssue": "unsupported-polling"
}
```

---

## 🎨 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| Draft | Blue | New document, not reviewed |
| Awaiting Research | Orange (pulsing) | Has pending fact-check requests |
| Ready for Review | Light Green | All issues resolved, awaiting approval |
| Approved | Green | Approved by editor |
| Published | Purple | Live/sent to media |

## 🎯 Priority Levels

| Priority | Color | When to Use |
|----------|-------|-------------|
| Urgent | Red | Due today or overdue |
| High | Orange | Important, due soon |
| Normal | Gray | Standard priority |
| Low | Light Gray | No rush |

---

## 🔧 Technical Notes

### Auto-save:
- Triggers every 30 seconds
- Saves to localStorage
- Updates queue in real-time

### Quote Parsing:
- Handles multi-part quotes: `"Part 1," Smith said. "Part 2."`
- Preserves capitalization
- Combines consecutive quotes from same speaker
- Converts commas to periods for proper sentences

### Section Detection:
- Automatically separates dateline from lead paragraph
- Detects quote speaker from attribution
- Classifies quotes by speaker role (candidate/staff/outsider)

---

## 📁 File Locations

```
/Users/edf/Polis/public/
├── editor-queue.html          ← Queue dashboard (START HERE)
├── unified-editor-v2.html     ← Main editor
├── WHICH-EDITOR.html          ← Editor selection guide
└── tests/fixtures/
    └── sample_test_release.txt ← Sample data
```

---

## 🚦 Status Transitions

```
Draft
  ↓ (quality checks find issues requiring research)
Awaiting Research
  ↓ (research completed, all issues resolved)
Ready for Review
  ↓ (editor approval)
Approved
  ↓ (sent to media)
Published
```

---

## ⌨️ Keyboard Shortcuts (Future)

*To be implemented*

- `Cmd+S` - Save
- `Cmd+E` - Export
- `Cmd+K` - Toggle Full/Section view
- `Cmd+/` - Open preferences
