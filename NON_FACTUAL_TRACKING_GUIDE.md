# Non-Factual Statement Tracking System

## Overview

The system now tracks statements that **appear to be facts but cannot be fact-checked**, along with detailed explanations of why they cannot be verified.

## Key Features

✅ **Automated detection** of 4 categories of non-factual statements
✅ **Detailed explanations** for each statement
✅ **Database storage** with full metadata
✅ **REST API** for querying and analysis
✅ **Batch processing** of all example files

---

## The 4 Categories

### 1. **Opinion/Characterization** (21 statements found)

Subjective judgments that cannot be objectively verified.

**Examples:**
- "awful Republican tax bill"
- "failed policies"
- "dangerous rhetoric"

**Why not verifiable:** Different people have different definitions based on values and perspectives.

---

### 2. **Predictions/Future** (69 statements found) ⭐ **MOST COMMON**

Claims about future events that haven't occurred yet.

**Examples:**
- "will cost 15 million Americans their healthcare"
- "threatens to undermine democracy"
- "may lead to economic crisis"

**Why not verifiable:** Events that haven't happened cannot be verified. What CAN be verified is if authoritative sources (CBO, experts) made such predictions.

---

### 3. **Motivations/Intent** (12 statements found)

Claims about what someone wants, intends, or cares about.

**Examples:**
- "Republicans want to hurt families"
- "refuses to negotiate"
- "doesn't care about Americans"

**Why not verifiable:** Cannot verify internal mental states. Only actions and statements can be verified.

---

### 4. **Value Judgments** (12 statements found)

Normative claims about what should/must be done or moral judgments.

**Examples:**
- "This is wrong"
- "They should be ashamed"
- "We must act now"

**Why not verifiable:** Moral and ethical claims depend on value systems, not empirical evidence.

---

## Statistics from 54 Files

| Category | Count | Percentage |
|----------|-------|------------|
| **Factual Claims** | 135 | 23.6% |
| **Non-Factual** | 114 | 19.9% |
| **Predictions** | 69 | 12.1% |
| **Opinions** | 21 | 3.7% |
| **Motivations** | 12 | 2.1% |
| **Value Judgments** | 12 | 2.1% |
| **Other** | 323 | 56.5% |

**Total statements analyzed:** 572

---

## API Endpoints

All endpoints require authentication with Bearer token.

### Get All Categories

```bash
GET /api/fact-checking/non-factual/categories

Response:
[
  {
    "id": 1,
    "category_name": "opinion_characterization",
    "description": "Subjective opinions and characterizations...",
    "detection_keywords": "[\"awful\", \"terrible\", ...]",
    "example_patterns": "[\"awful Republican tax bill\", ...]"
  },
  ...
]
```

### Get All Non-Factual Statements

```bash
GET /api/fact-checking/non-factual?limit=10&offset=0

# Filter by category
GET /api/fact-checking/non-factual?category=prediction_future

# Filter by source file
GET /api/fact-checking/non-factual?sourceFile=booker_01_shutdown.txt

Response:
{
  "statements": [
    {
      "id": 1,
      "statement_text": "will cost millions their healthcare",
      "reason_category": "prediction_future",
      "detailed_explanation": "This is a prediction about the future using \"will cost\"...",
      "source_file": "warren_01_shutdown.txt",
      "sentence_index": 3,
      "appears_factual_confidence": 0.7,
      "created_by_name": "System Admin"
    },
    ...
  ],
  "pagination": {
    "total": 114,
    "limit": 10,
    "offset": 0
  }
}
```

### Get Statements by Category

```bash
GET /api/fact-checking/non-factual/by-category/prediction_future

Response:
{
  "category": "prediction_future",
  "statements": [...],
  "total": 69
}
```

### Get Statements by Source File

```bash
GET /api/fact-checking/non-factual/by-file/booker_01_shutdown.txt

Response:
{
  "sourceFile": "booker_01_shutdown.txt",
  "statements": [...],
  "categoryBreakdown": [
    { "reason_category": "prediction_future", "count": 2 },
    { "reason_category": "value_judgment", "count": 1 }
  ],
  "total": 3
}
```

### Get Summary Statistics

```bash
GET /api/fact-checking/non-factual/stats/summary

Response:
{
  "total": 114,
  "byCategory": [
    {
      "category_name": "prediction_future",
      "description": "Predictions and speculation...",
      "count": 69
    },
    ...
  ],
  "topFiles": [
    { "source_file": "sherrill_04_utility_emergency.txt", "count": 13 },
    { "source_file": "sherrill_07_gateway_trump.txt", "count": 11 },
    ...
  ],
  "averageAppearsFactualConfidence": 0.62
}
```

### Create a Non-Factual Statement Record

```bash
POST /api/fact-checking/non-factual

Body:
{
  "statementText": "Trump's dangerous policies",
  "reasonCategory": "opinion_characterization",
  "detailedExplanation": "This is a subjective characterization...",
  "sourceFile": "example.txt",
  "sentenceIndex": 5,
  "appearsFactualConfidence": 0.6,
  "keywordsDetected": ["dangerous"]
}

Response:
{
  "success": true,
  "id": 115,
  "message": "Non-factual statement recorded successfully"
}
```

---

## Database Schema

### `non_factual_statements` Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| fact_check_id | TEXT | Optional link to fact-check |
| statement_text | TEXT | The full statement |
| reason_category | TEXT | Category name |
| detailed_explanation | TEXT | Why it can't be verified |
| source_file | TEXT | Original file |
| source_context | TEXT | Surrounding text |
| sentence_index | INTEGER | Position in text |
| appears_factual_confidence | REAL | How factual it looks (0-1) |
| keywords_detected | TEXT | JSON array of keywords |
| examples | TEXT | JSON array of examples |
| created_by | INTEGER | User ID |
| created_at | DATETIME | Timestamp |

### `non_factual_categories` Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| category_name | TEXT | Unique category identifier |
| description | TEXT | Category description |
| detection_keywords | TEXT | JSON array of keywords |
| example_patterns | TEXT | JSON array of examples |
| explanation_template | TEXT | Template for explanations |

---

## Batch Processing

### Run the Enhanced Processor

```bash
node batch-process-with-non-factual.js
```

This will:
1. Process all 54 .txt files in `cpo_examples/`
2. Extract factual claims using existing parser
3. **Extract non-factual statements using new detector**
4. **Store all non-factual statements in database with explanations**
5. Generate summary report

### Output

```
📊 PROCESSING COMPLETE
✅ Files processed: 54
📊 Total statements: 572
✅ Factual claims: 135 (23.6%)
❌ Non-factual: 114 (19.9%)

📈 Non-factual breakdown:
   Opinion/Characterization: 21
   Predictions/Future: 69
   Motivations/Intent: 12
   Value Judgments: 12

💾 Results saved to: batch-results-with-non-factual.json
💾 Database updated: ./campaign.db
```

---

## Use Cases

### 1. Content Review

Query all non-factual statements from a specific press release to understand what cannot be fact-checked:

```bash
GET /api/fact-checking/non-factual/by-file/warren_01_shutdown.txt
```

### 2. Pattern Analysis

Identify which categories appear most frequently in your content:

```bash
GET /api/fact-checking/non-factual/stats/summary
```

**Finding:** Predictions (69 statements) are the most common non-factual category, suggesting content is heavy on future-oriented rhetoric.

### 3. Editorial Guidance

Review statements that "look factual" (high `appears_factual_confidence` score) but aren't:

```sql
SELECT * FROM non_factual_statements
WHERE appears_factual_confidence > 0.7
ORDER BY appears_factual_confidence DESC;
```

These are the statements most likely to confuse fact-checkers.

### 4. Training Data

Export non-factual statements with explanations to train editors on the difference between facts and non-facts:

```bash
GET /api/fact-checking/non-factual?limit=100
```

---

## Integration with Existing Fact-Checking

The non-factual tracking system integrates seamlessly with the existing fact-checking workflow:

1. **Extract claims** from content using `/api/fact-checking/:id/extract-claims`
2. **Factual claims** → stored in `extracted_claims` table → can be verified
3. **Non-factual statements** → stored in `non_factual_statements` table → flagged with explanation

Both are tracked, but handled differently:
- **Factual claims:** Verify with sources
- **Non-factual statements:** Document why they can't be verified

---

## Files Modified/Created

### Database
- `backend/database/init.js` - Added 2 new tables
  - `non_factual_statements`
  - `non_factual_categories` (with 4 seeded categories)

### API
- `backend/routes/fact-checking.js` - Added 7 new endpoints
  - GET `/non-factual/categories`
  - GET `/non-factual`
  - GET `/non-factual/:id`
  - POST `/non-factual`
  - GET `/non-factual/by-category/:category`
  - GET `/non-factual/by-file/:filename`
  - GET `/non-factual/stats/summary`

### Parser
- `backend/utils/press-release-parser.js` - Added 2 new methods
  - `extractNonFactualStatements(text)`
  - `calculateAppearsFactualConfidence(sentence)`

### Processing
- `batch-process-with-non-factual.js` - New batch processor

### Documentation
- `NON_FACTUAL_TRACKING_GUIDE.md` - This file

---

## Next Steps

### Recommended Enhancements

1. **UI Dashboard**: Create a visual interface showing non-factual breakdowns by category
2. **Export to CSV**: Add endpoint to export non-factual statements for analysis
3. **Integration with Editor**: Flag non-factual statements in real-time as user types
4. **Confidence Tuning**: Adjust `appears_factual_confidence` scoring based on feedback
5. **Additional Categories**: Add "mixed statements" (part fact, part opinion)

### Usage Tips

- **High-confidence non-facts** (≥0.7) deserve extra attention - they look factual but aren't
- **Predictions** can sometimes be rewritten as attributions: "will cost millions" → "CBO projects costs of millions"
- **Opinions** can often be supported by facts: "failed policy" → "policy that resulted in X, Y, Z outcomes"

---

## Summary

The system now provides **complete visibility** into both:
1. **What CAN be fact-checked** (135 factual claims)
2. **What CANNOT be fact-checked** (114 non-factual statements) **← NEW!**

Each non-factual statement includes:
- ✅ **Category** (opinion, prediction, motivation, value judgment)
- ✅ **Explanation** of why it can't be verified
- ✅ **Confidence score** for how factual it appears
- ✅ **Source file** and context
- ✅ **Keywords** that triggered detection

**Total coverage:** 249 statements classified out of 572 total (43.5% categorized as either factual or non-factual)

Server running at: **http://localhost:3001**
API base URL: **http://localhost:3001/api/fact-checking**
