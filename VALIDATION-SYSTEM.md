# Press Release Validation System

## Overview

The Press Release Validation System automatically evaluates press release quality and provides actionable feedback to help authors improve their content before submission. It assigns a quality score (0-100) and can automatically reject releases that are too poorly formatted to parse effectively.

## Features

- **Quality Scoring**: 0-100 point system with clear quality tiers
- **Auto-Rejection**: Releases scoring below 40 are automatically rejected
- **Actionable Feedback**: Specific suggestions for fixing each issue
- **Backward Compatible**: Original `parse()` method still works without validation
- **Severity Levels**: Errors (critical) and Warnings (high/medium/low priority)

## Quick Start

### Basic Usage

```javascript
const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();

// Parse with validation (recommended)
const result = parser.parseWithValidation(pressReleaseText);

// Check if rejected
if (result.validation.should_reject) {
    console.log('REJECTED:', result.validation.errors);
} else {
    console.log('ACCEPTED - Quality Score:', result.validation.quality_score);
    // Process the parsed data
    console.log('Quotes:', result.quotes);
}
```

### API Endpoint Pattern

```javascript
app.post('/api/press-releases', (req, res) => {
    const result = parser.parseWithValidation(req.body.text);

    if (result.validation.should_reject) {
        return res.status(400).json({
            error: 'Press release rejected',
            validation: result.validation
        });
    }

    return res.json({
        success: true,
        data: result,
        validation: result.validation
    });
});
```

## Quality Scoring System

### Score Ranges

| Score | Status | Description |
|-------|--------|-------------|
| 90-100 | **Excellent** | Well-formatted, complete press release |
| 75-89 | **Good** | Minor issues, fully parseable |
| 60-74 | **Fair** | Some quality issues, parseable |
| 40-59 | **Poor** | Significant issues but parseable |
| 0-39 | **Rejected** | Too many critical errors, cannot process |

### Point Deductions

#### Critical Errors (Auto-reject if total < 40)

- **Missing "FOR IMMEDIATE RELEASE" header**: -30 points
- **No quotes found**: -40 points
- **No meaningful headline**: -25 points
- **Insufficient content** (< 100 chars): -35 points

#### High-Priority Warnings

- **Missing dateline**: -15 points
- **>75% unknown speakers**: -20 points
- **>50% unknown speakers**: -10 points

#### Medium/Low Warnings

- **Only 1 quote** (should have 2-3): -5 points
- **Some unknown speakers** (<50%): -5 points
- **Short content** (< 200 chars): -5 points

## Validation Result Structure

```javascript
{
    quality_score: 85,
    status: 'good',
    should_reject: false,
    errors: [
        {
            type: 'no_quotes',
            message: 'No quotes found in press release',
            suggestion: 'Add at least one quote with proper attribution...'
        }
    ],
    warnings: [
        {
            type: 'missing_dateline',
            severity: 'high',
            message: 'Missing dateline (location and date)',
            suggestion: 'Add a dateline in format: CITY, STATE — Month Day, Year'
        }
    ],
    suggestions: [
        'This press release is parseable but could be improved.'
    ],
    metrics: {
        quote_count: 2,
        unknown_speakers: 0,
        unknown_speaker_percentage: 0,
        body_length: 450,
        has_dateline: true,
        has_headline: true,
        has_for_immediate_release: true
    }
}
```

## Common Issues and Fixes

### ❌ Missing "FOR IMMEDIATE RELEASE" Header

**Problem**: Press release doesn't start with standard header

**Fix**: Add as first line:
```
FOR IMMEDIATE RELEASE
```

### ❌ No Quotes Found

**Problem**: Parser cannot find any quoted statements

**Fix**: Add quotes with proper attribution:
```
"This is a quote," said Jane Smith, Senator.
```

### ❌ Insufficient Content

**Problem**: Body text is too short (< 100 characters)

**Fix**: Expand with meaningful content, background, and context

### ⚠️ Missing Dateline

**Problem**: No location/date information

**Fix**: Add after header:
```
WASHINGTON, D.C. — October 2, 2025
```

### ⚠️ Unknown Speakers

**Problem**: Quotes found but speaker names not extracted

**Fix**: Use clear attribution patterns:
```
"Quote text," said FirstName LastName, Title.
"Quote text," FirstName LastName stated.
```

## Testing

Run validation tests:

```bash
# Test validation system
node test-validation.js

# Analyze quality issues
node test-quality-analysis.js

# View usage examples
node validation-usage-example.js
```

## Examples

### Excellent Press Release (Score: 100)

```
FOR IMMEDIATE RELEASE

WASHINGTON, D.C. — October 2, 2025

Senator Smith Announces New Infrastructure Bill

Senator Jane Smith announced today a comprehensive infrastructure package
that will invest $50 billion in roads, bridges, and public transit over
the next decade.

"This bill will create thousands of jobs and rebuild our crumbling
infrastructure," said Senator Jane Smith.

"We're committed to sustainable development and green jobs," Smith added.

The bill is expected to come to a vote next month.
```

**Result**: Score 100, Status: Excellent ✅

### Rejected Press Release (Score: 10)

```
FOR IMMEDIATE RELEASE

Campaign Event

Join us next week.
```

**Issues**:
- ❌ No quotes (-40)
- ❌ No meaningful content (-35)
- ⚠️ Missing dateline (-15)

**Result**: Score 10, Status: Rejected 🚫

## Integration Guide

### Step 1: Update Your Parser Usage

Replace:
```javascript
const result = parser.parse(text);
```

With:
```javascript
const result = parser.parseWithValidation(text);
```

### Step 2: Handle Validation Results

```javascript
if (result.validation.should_reject) {
    // Show errors to user
    return showErrors(result.validation.errors);
}

if (result.validation.quality_score < 75) {
    // Show warnings to user
    return showWarnings(result.validation.warnings);
}

// Process normally
return processRelease(result);
```

### Step 3: Display Feedback to Users

```javascript
function displayFeedback(validation) {
    console.log(`Quality: ${validation.quality_score}/100 (${validation.status})`);

    validation.errors.forEach(err => {
        console.log(`❌ ${err.message}`);
        console.log(`   Fix: ${err.suggestion}`);
    });

    validation.warnings.forEach(warn => {
        console.log(`⚠️ ${warn.message}`);
        console.log(`   Tip: ${warn.suggestion}`);
    });
}
```

## Backward Compatibility

The original `parse()` method still works without validation:

```javascript
// Old code still works
const result = parser.parse(text);
// result.validation will not exist

// New code with validation
const result = parser.parseWithValidation(text);
// result.validation contains quality data
```

## Configuration

The validation thresholds are currently hard-coded but can be adjusted in the `validateQuality()` method:

```javascript
// In press-release-parser.js
if (validation.quality_score < 40) {
    validation.should_reject = true;  // Adjust threshold here
}
```

## Future Enhancements

Potential improvements:

1. **Configurable thresholds**: Allow custom rejection/warning thresholds
2. **Custom rules**: Add domain-specific validation rules
3. **Spell checking**: Detect common spelling/grammar issues
4. **Format detection**: Identify specific press release formats
5. **Auto-fix suggestions**: Provide code snippets to fix issues
6. **Quality history**: Track quality scores over time

## Support

For issues or questions:
- Review examples: `validation-usage-example.js`
- Run tests: `test-validation.js`
- Check quality: `test-quality-analysis.js`

---

**Version**: 1.0
**Last Updated**: October 2, 2025
