# Editorial Workflow - Two-Stage Process

## Overview

The application supports two distinct user roles with separate workflows:

1. **Parser Reviewer** - Validates parser extraction (Stage 1)
2. **Content Editor** - Enhances editorial quality (Stage 2)

The same person CAN perform both roles, but the workflows are distinct and tracked separately.

---

## Stage 1: Parser Validation (Parser Reviewer)

### Objective
Verify that the parser correctly extracted content into the right fields.

### Workflow
```
1. Import draft → Parser extracts fields
2. Review Parsing tab appears with validation UI
3. Side-by-side view: Original text | Extracted fields
4. For each field:
   - ✓ Correct - Mark as validated
   - ✗ Wrong field - Move to correct field
   - ✗ Wrong extraction - Fix the content
   - ✗ Missing - Add from original text
5. Submit Parser Feedback → Trains parser
6. Mark as "Ready for Editing" → Moves to Stage 2
```

### UI Elements
- **Validation Progress**: "Reviewed 7 of 10 fields"
- **Confidence Indicators**: Parser shows confidence % per field
- **Quick Actions**:
  - "Move to Quote Field"
  - "Extract to Contact"
  - "Delete (Not in original)"
- **Original Text Panel**: Always visible, searchable, highlightable
- **Submit & Continue**: Sends feedback, advances to editing stage

### Tracking
- Time to validate (performance metric)
- Fields corrected (parser accuracy)
- Movement patterns (training data)
- Validator identity (if multi-user)

---

## Stage 2: Editorial Enhancement (Content Editor)

### Objective
Transform validated content into publication-ready press release.

### Workflow
```
1. Receive validated fields from Stage 1
2. Review baseline content
3. Apply AI recommendations:
   - Voice & Tone suggestions
   - AP Style corrections
   - Grammar fixes
   - Prose enhancements
4. Make manual improvements
5. Run quality checks
6. Preview all outputs
7. Export final files
```

### UI Elements
- **AI Recommendations Panel**: Pending suggestions with Accept/Reject
- **Quality Dashboard**: Scores for Voice, Style, Grammar
- **Track Changes**: See all edits with rationale
- **Enhancement Tools**:
  - Voice Matcher
  - Prose Enhancer (⌘⇧E)
  - AP Style Checker
  - Fact Verifier
- **Export Options**: HTML, TXT, JSON-LD, Tracked Changes

### Tracking
- Editorial changes (improvement patterns)
- AI acceptance rate (quality of suggestions)
- Time to publish (efficiency)
- Quality scores (output assessment)
- Editor identity

---

## Role Separation Benefits

### For Parser Reviewer
✅ Focused task: Just validate extraction
✅ No editorial decisions required
✅ Clear success criteria (all fields validated)
✅ Immediate feedback to parser
✅ Training data captured cleanly

### For Content Editor
✅ Starts with clean, validated data
✅ Can trust field assignments
✅ Focus on quality, not structure
✅ AI suggestions are relevant
✅ Track changes show editorial work only

### For Organization
✅ Separate skill sets (QC vs. Editorial)
✅ Parallel processing possible
✅ Clear responsibility boundaries
✅ Better training data quality
✅ Audit trail by role

---

## Implementation States

### Field States
- `parsed` - Initial parser extraction
- `validated` - Reviewed by parser reviewer
- `edited` - Modified by content editor
- `enhanced` - AI suggestions applied
- `final` - Ready for export

### Change Attribution
Every change records:
- **Role**: `parser-reviewer` | `content-editor` | `ai-assistant`
- **Stage**: `validation` | `editing`
- **Type**: `field-correction` | `content-enhancement` | `style-correction`
- **User**: (if multi-user system)
- **Timestamp**: When change was made

### Workflow Gates
- **Gate 1**: All fields validated → Enable editing stage
- **Gate 2**: Quality checks pass → Enable export
- **Gate 3**: Final approval → Publish

---

## Single-User Mode

If the same person performs both roles:

1. **Import Draft** → Parser extracts
2. **Validation Mode** (automatic)
   - Quick review of extractions
   - Fix any obvious errors
   - Click "Looks Good" or "Corrections Made"
3. **Editing Mode** (automatic)
   - AI suggestions appear
   - Enhancement tools available
   - Track changes enabled
4. **Export** → Generate files

The workflow is streamlined but still distinguishes between validation changes (parser learning) and editorial changes (content improvement).

---

## Multi-User Mode

If roles are separated:

### Parser Reviewer Workflow
1. Opens **Validation Dashboard**
2. Sees queue of unparsed drafts
3. Picks a draft to validate
4. Reviews and corrects
5. Clicks "Submit & Mark Ready"
6. Draft moves to editor queue

### Content Editor Workflow
1. Opens **Editorial Dashboard**
2. Sees queue of validated drafts
3. Picks a draft to edit
4. Enhances content
5. Exports final files
6. Draft marked as published

### Benefits
- Parallel processing (multiple drafts)
- Specialization (different skills)
- Clear handoff points
- Separate metrics per role
- Training data segmentation

---

## Metrics by Role

### Parser Reviewer Metrics
- Validation time per draft
- Fields corrected per draft
- Accuracy improvement over time
- Most common correction types
- Parser learning contribution

### Content Editor Metrics
- Editing time per draft
- AI acceptance rate
- Quality score improvements
- Voice consistency rating
- Publication success rate

### System Metrics
- End-to-end time (import → publish)
- Handoff time (Stage 1 → Stage 2)
- Overall accuracy trends
- User efficiency comparison

---

## Proposed UI Changes

### Add Stage Indicator
```
[Parser Validation] ━━━━━ [Editorial Enhancement] ━━━━━ [Export]
     (Active)              (Locked - Pending)        (Locked)
```

### Add Role Selector (Optional)
```
I am: [Parser Reviewer ▼]
      [Content Editor]
      [Both Roles]
```

### Add Validation Panel
- Side-by-side: Original | Parsed
- Per-field validation checkboxes
- Quick correction actions
- Progress indicator

### Add Editorial Panel (Current UI)
- AI recommendations
- Enhancement tools
- Quality checks
- Track changes

### Add Handoff Actions
- "Submit for Editing" (Parser Reviewer)
- "Return for Validation" (Content Editor, if issues found)
- "Mark as Published" (Content Editor)

---

## Next Steps

1. Implement stage-based workflow
2. Add validation UI panel
3. Separate tracking by role/stage
4. Create role-specific dashboards
5. Add handoff mechanisms
6. Update training data collection to distinguish validation vs. editorial changes
