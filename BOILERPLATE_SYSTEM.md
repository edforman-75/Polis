# Boilerplate Management System

## Overview

The boilerplate management system automatically detects, tracks, and protects standard boilerplate paragraphs used in press releases. Boilerplate paragraphs are typically biographical information about the candidate that remains consistent across all releases.

## Key Features

✅ **Automatic Detection** - AI-powered detection of boilerplate paragraphs
✅ **Library Management** - Stores and tracks all known boilerplate per candidate
✅ **Modification Warnings** - Alerts editors when trying to edit boilerplate
✅ **Change Tracking** - Records all modifications to boilerplate
✅ **Similarity Matching** - Detects slight variations (85%+ similarity)
✅ **Usage Analytics** - Tracks how often boilerplate is used and modified

## How It Works

### 1. Boilerplate Detection

The system uses pattern matching and heuristics to identify boilerplate:

**Detection Criteria:**
- **Position**: Usually last or second-to-last paragraph
- **Opening Phrases**: Starts with "[Name] is a..." or "A lifelong resident of..."
- **Biographical Terms**: Contains words like "graduated," "degree," "elected," "serves as"
- **Educational Credentials**: Mentions B.A., M.A., Ph.D., etc.
- **Length**: Typically 50-200 words
- **Past Tense**: Uses past tense for biographical narrative

**Confidence Scoring:**
Each detected paragraph gets a confidence score (0.0 to 1.0):
- **0.9-1.0**: Very high confidence (exact match)
- **0.7-0.9**: High confidence (likely boilerplate)
- **0.5-0.7**: Medium confidence (possible boilerplate)
- **<0.5**: Low confidence (not boilerplate)

### 2. Boilerplate Library

When boilerplate is detected:
1. Text is normalized and hashed (SHA-256)
2. Stored in `boilerplate_library` table with metadata
3. Linked to candidate name
4. Tracked with usage count and last used date

**Example Boilerplate:**
```
John Smith is a lifelong resident of Massachusetts and a proven leader
in education reform. As State Senator, he has championed legislation to
increase teacher pay and expand access to early childhood education.
Smith holds a B.A. from Boston College and an M.Ed. from Harvard University.
He lives in Boston with his wife and two children.
```

### 3. Editor Warnings

When an editor tries to modify boilerplate:

**Warning Levels:**
- 🟢 **LOW** - Minor edits (>95% similarity)
- 🟡 **MEDIUM** - Significant changes (75-95% similarity)
- 🔴 **HIGH** - Major rewrite (<75% similarity)

**Warning UI:**
```
⚠️  BOILERPLATE MODIFICATION DETECTED

You are attempting to edit the candidate's boilerplate paragraph.
This text is typically consistent across all press releases.

Original:
"John Smith is a lifelong resident..."

Your changes:
"John Smith is a former resident..."

Are you sure you want to make this change?
[ Yes, I understand ] [ Revert to Original ]
```

### 4. Change Tracking

All boilerplate modifications are tracked:

**Modification Types:**
- **minor**: <5% change (typo fixes, punctuation)
- **significant**: 5-25% change (adding/removing details)
- **complete-rewrite**: >25% change (new boilerplate)

**Stored Data:**
- Original text
- Modified text
- Similarity score
- Editor who made change
- Timestamp
- Assignment ID

## API Endpoints

### Detect Boilerplate
```javascript
POST /api/boilerplate/detect
{
  "text": "Full press release text...",
  "candidateName": "John Smith"
}

Response:
{
  "detected": [
    {
      "text": "Paragraph text...",
      "confidence": 0.92,
      "position": "last",
      "indicators": ["last-paragraph", "biographical-terms-5"]
    }
  ],
  "primary": { /* Best match */ }
}
```

### Check if Text is Boilerplate
```javascript
POST /api/boilerplate/check
{
  "text": "Paragraph to check...",
  "candidateName": "John Smith"
}

Response:
{
  "isBoilerplate": true,
  "confidence": 0.88,
  "matchedKnownBoilerplate": true,
  "matchedBoilerplateId": 123,
  "similarity": 0.95,
  "isExact": false
}
```

### Add to Library
```javascript
POST /api/boilerplate/add
{
  "candidateName": "John Smith",
  "text": "Boilerplate text...",
  "metadata": {
    "type": "campaign",
    "firstSeenIn": "assignment_456"
  }
}
```

### Record Usage
```javascript
POST /api/boilerplate/record-usage
{
  "boilerplateId": 123,
  "assignmentId": 456,
  "originalText": "Original...",
  "modifiedText": "Modified..." // optional
}

Response:
{
  "success": true,
  "wasModified": true,
  "modificationType": "significant",
  "similarity": 0.82
}
```

### Create Warning
```javascript
POST /api/boilerplate/warn
{
  "assignmentId": 456,
  "boilerplateId": 123,
  "warningType": "edit-attempt",
  "originalText": "...",
  "attemptedChange": "...",
  "editorUser": "editor@campaign.com"
}

Response:
{
  "success": true,
  "warningId": 789,
  "severity": "medium",
  "similarity": 0.78
}
```

### Get Candidate's Boilerplates
```javascript
GET /api/boilerplate/candidate/John%20Smith

Response:
{
  "candidateName": "John Smith",
  "boilerplates": [
    {
      "id": 123,
      "boilerplate_text": "...",
      "usage_count": 45,
      "last_used_date": "2025-01-15",
      "confidence_score": 1.0
    }
  ]
}
```

### Get Modification History
```javascript
GET /api/boilerplate/history/John%20Smith?limit=50

Response:
{
  "candidateName": "John Smith",
  "history": [
    {
      "original_text": "...",
      "modified_text": "...",
      "modification_type": "significant",
      "similarity_score": 0.82,
      "modified_by": "editor@campaign.com",
      "used_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

## Integration with Editor

### During Parsing

```javascript
// In parser or editor initialization
const response = await fetch('/api/boilerplate/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: pressReleaseText,
    candidateName: 'John Smith'
  })
});

const { primary } = await response.json();

if (primary && primary.confidence >= 0.7) {
  // Extract to boilerplate field
  fields.boilerplate = primary.text;

  // Mark as protected
  markFieldAsProtected('boilerplate');

  // Add to library
  await fetch('/api/boilerplate/add', {
    method: 'POST',
    body: JSON.stringify({
      candidateName: 'John Smith',
      text: primary.text
    })
  });
}
```

### During Editing

```javascript
// Monitor boilerplate field for changes
boilerplateField.addEventListener('input', async (e) => {
  const newValue = e.target.value;
  const originalValue = storedBoilerplate.text;

  // Check if modification is significant
  const response = await fetch('/api/boilerplate/check', {
    method: 'POST',
    body: JSON.stringify({
      text: newValue,
      candidateName: 'John Smith'
    })
  });

  const result = await response.json();

  if (result.isBoilerplate && result.similarity < 0.95) {
    // Show warning
    showBoilerplateWarning(originalValue, newValue, result.similarity);

    // Record warning
    await fetch('/api/boilerplate/warn', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: currentAssignment.id,
        boilerplateId: result.matchedBoilerplateId,
        warningType: 'edit-attempt',
        originalText: originalValue,
        attemptedChange: newValue,
        editorUser: currentUser.email
      })
    });
  }
});
```

### Visual Indicators

**Protected Field Styling:**
```css
.field-boilerplate {
  background: #fffbeb;
  border: 2px solid #fbbf24;
  position: relative;
}

.field-boilerplate::before {
  content: "🔒 Protected Boilerplate";
  position: absolute;
  top: -20px;
  left: 0;
  font-size: 11px;
  color: #92400e;
  font-weight: 600;
}
```

## Database Schema

### boilerplate_library
- Stores all known boilerplate paragraphs
- One row per unique boilerplate (by hash)
- Tracks usage count and dates

### boilerplate_usage
- Records each use of boilerplate
- Tracks modifications and similarity scores
- Links to assignments

### boilerplate_warnings
- Stores warnings when editors try to modify
- Tracks acknowledgments
- Different severity levels

## Analytics & Reporting

### Boilerplate Consistency Report
```javascript
GET /api/boilerplate/history/John%20Smith

// Shows:
// - Total uses: 145
// - Unmodified uses: 132 (91%)
// - Minor modifications: 10 (7%)
// - Significant changes: 3 (2%)
```

### Modification Patterns
- Which editors modify boilerplate most often?
- What types of changes are common?
- When do modifications occur (time of day, urgency)?

## Best Practices

1. **Review Boilerplate Quarterly** - Update when candidate's bio changes
2. **Train Editors** - Explain why boilerplate should remain consistent
3. **Allow Legitimate Updates** - When candidate gets new degree, position, etc.
4. **Monitor Warnings** - Review why editors are making changes
5. **Keep Library Clean** - Deactivate outdated boilerplate

## Future Enhancements

- AI-powered boilerplate suggestions based on candidate profile
- Multi-language boilerplate support
- Automatic boilerplate refresh from candidate database
- Boilerplate versioning (track changes over time)
- Integration with compliance/legal review
