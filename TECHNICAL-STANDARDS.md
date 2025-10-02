# Press Release Technical Structure Standards

## Overview

This document defines the **minimum technical standards** for press release submissions. Press releases that fail these standards are **immediately rejected** before any content editing or quality assessment.

These are **structural and encoding requirements**, not content quality requirements. Quality issues (missing quotes, poor writing, etc.) are handled separately in the editing workflow.

---

## Rejection Criteria

Press releases are **automatically rejected** for the following technical issues:

### 1. Invalid Input

**Issue**: Input is not text or cannot be read as text

**Examples:**
- Empty submission
- `null` or `undefined` values
- Non-string data types

**Error Message:**
> "Input is not a valid string. Provide text as a string value."

---

### 2. Empty or Whitespace-Only

**Issue**: Input contains no actual content

**Examples:**
```
[empty]
```

```



```

**Error Message:**
> "Input is empty or contains only whitespace. Provide actual press release text."

---

### 3. Too Short

**Issue**: Input is less than 50 characters

**Minimum**: 50 characters
**Reason**: A meaningful press release cannot be less than 50 characters

**Example (35 chars):**
```
Press conference today at 3pm.
```

**Error Message:**
> "Input is too short (35 chars, minimum 50). Press releases should be at least 50 characters long."

**Fix**: Expand with proper structure:
```
FOR IMMEDIATE RELEASE

CITY, STATE — Date

Headline Here

Body paragraph with actual content that explains what is being announced.

"Quote here," said Name.
```

---

### 4. Too Large

**Issue**: Input exceeds 1MB (1,000,000 characters)

**Maximum**: 1,000,000 characters (1MB)
**Reason**: Prevents denial-of-service attacks and processing timeouts

**Error Message:**
> "Input exceeds maximum size (1,500,000 chars, max 1,000,000). Press releases should be under 1MB."

**Fix**: Split into multiple press releases or remove unnecessary content

---

### 5. Binary or Corrupt Data

**Issue**: Input contains binary data, null bytes, or control characters

**Examples:**
- Files with null bytes (`\x00`)
- Binary file formats (PDF, Word, images)
- Corrupt text encoding
- Control characters

**Error Message:**
> "Input contains binary or corrupt data. Ensure the file is plain text (UTF-8)."

**Fix**:
- Convert from PDF/Word to plain text
- Save file as UTF-8 text
- Check file encoding

---

### 6. No Text Content

**Issue**: Input contains no meaningful text (fewer than 20 letters)

**Examples:**
```
!@#$%^&*()_+-=[]{}|;:,.<>?
```

```
123456789 987654321
```

**Error Message:**
> "Input contains no meaningful text content. Provide actual press release text with letters and words."

**Reason**: Press releases must contain actual words, not just numbers/symbols

---

## Warnings (Non-Blocking)

These issues generate **warnings** but do not block submission. However, they indicate the input may not parse correctly.

### HTML Detected

**Issue**: Input appears to contain HTML markup

**Example:**
```html
<html>
<body>
<h1>Press Release</h1>
<p>Content here</p>
</body>
</html>
```

**Warning:**
> "Input appears to contain HTML markup. Convert HTML to plain text before parsing."

**Severity**: High

**Fix**: Extract text from HTML tags or use HTML-to-text converter

---

### JSON Detected

**Issue**: Input appears to be JSON data

**Example:**
```json
{
  "title": "Press Release",
  "content": "Text here",
  "date": "2025-10-02"
}
```

**Warning:**
> "Input appears to be JSON data. Extract the text content from JSON before parsing."

**Severity**: High

**Fix**: Extract the text fields from JSON structure

---

### Extremely Long Lines

**Issue**: One or more lines exceed 5,000 characters

**Example:**
```
This is a very long line that goes on and on and on for thousands of characters without any line breaks which makes it hard to parse and could cause performance issues...
```

**Warning:**
> "Found 1 line(s) over 5000 characters. Press releases should have reasonable line breaks."

**Severity**: Medium

**Reason**: Could indicate formatting issues or potential ReDoS (Regular Expression Denial of Service)

**Fix**: Add line breaks at reasonable intervals (every 100-200 characters)

---

### No Line Breaks

**Issue**: Entire press release is one line with no paragraph breaks

**Example:**
```
FOR IMMEDIATE RELEASE WASHINGTON, D.C. — Oct 2, 2025 Headline Here Body text without breaks "Quote" said Name.
```

**Warning:**
> "Input has no line breaks (all one line). Add line breaks to properly structure the press release."

**Severity**: Medium

**Fix**: Add line breaks after header, between sections, and between paragraphs

---

### Excessive Special Characters

**Issue**: More than 30% of characters are special characters

**Example:**
```
***!!! URGENT !!!*** $$$ BIG NEWS $$$ @@@ ATTENTION @@@
```

**Warning:**
> "45% of input is special characters. Input may not be plain text or may be corrupt."

**Severity**: Low

**Reason**: May indicate spam, corrupt data, or unusual encoding

**Fix**: Use normal text formatting

---

## Minimum Acceptable Format

To pass technical validation, a press release must:

1. ✅ Be plain text (UTF-8)
2. ✅ Be 50-1,000,000 characters long
3. ✅ Contain at least 20 letters
4. ✅ Have no binary/corrupt data
5. ✅ Be a valid string

**Minimum Example (50 characters):**
```
FOR IMMEDIATE RELEASE

Headline here text content.
```

This minimal example passes **technical** validation but would fail **quality** validation (handled separately).

---

## Best Practices

To avoid any technical issues:

### ✅ DO:
- Use plain text format (UTF-8)
- Add line breaks between sections
- Keep lines under 1000 characters
- Use standard text encoding
- Submit as `.txt` files or text strings

### ❌ DON'T:
- Submit PDF, Word, or binary files
- Submit HTML without converting to text
- Submit JSON without extracting text
- Submit files with unusual encoding
- Submit extremely large files (> 100KB typical)

---

## Validation Flow

```
User submits press release
         ↓
[Technical Validation]
         ↓
   Pass or Fail?
         ↓
    ┌────┴────┐
    ↓         ↓
  PASS      FAIL
    ↓         ↓
Continue  Reject
to edit   immediately
          with error
          message
```

**If technical validation fails**: Release is immediately rejected with specific error messages

**If technical validation passes**: Release continues to editing workflow where content quality is assessed

---

## Error Response Format

When a release is rejected, you'll receive:

```javascript
{
  "is_parseable": false,
  "error": "Input failed technical validation",
  "technical_validation": {
    "is_parseable": false,
    "errors": [
      {
        "type": "too_short",
        "message": "Input is too short (35 chars, minimum 50)",
        "suggestion": "Press releases should be at least 50 characters long"
      }
    ],
    "warnings": []
  }
}
```

---

## Summary

| Criterion | Requirement | Action if Failed |
|-----------|-------------|------------------|
| **Valid string** | Must be text | ❌ Reject |
| **Not empty** | Must have content | ❌ Reject |
| **Length** | 50 - 1,000,000 chars | ❌ Reject |
| **Encoding** | No binary data | ❌ Reject |
| **Text content** | At least 20 letters | ❌ Reject |
| **HTML** | Plain text preferred | ⚠️ Warn |
| **JSON** | Plain text preferred | ⚠️ Warn |
| **Line length** | < 5000 chars/line | ⚠️ Warn |
| **Line breaks** | Should have breaks | ⚠️ Warn |

**Remember**: These are **structural** requirements only. Content quality (quotes, attribution, newsworthiness, etc.) is evaluated separately in the editing workflow.

---

**Last Updated**: October 2, 2025
**Version**: 1.0
