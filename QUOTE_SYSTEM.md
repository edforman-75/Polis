# Quote Extraction and Quality Analysis System

## Overview

The quote system automatically extracts quotes from press releases, analyzes their quality, and tracks modifications. It includes special handling for candidate quotes to ensure style consistency.

## Key Features

✅ **Automatic Quote Extraction** - Extracts quotes with speaker name and title
✅ **Quality Analysis** - Checks for problematic content (run-on sentences, vague language, attack language, etc.)
✅ **Candidate Style Consistency** - Compares candidate quotes to previous quotes for style deviations
✅ **LD-JSON Generation** - Creates Schema.org Quotation markup for SEO
✅ **Modification Tracking** - Records changes to quotes (they're usually pre-approved)
✅ **Protection System** - Warns editors when modifying quotes

## Components

### 1. Quote Extractor (`backend/utils/quote-extractor.js`)

Extracts quotes using multiple patterns:
- Standard: `"Quote" said Speaker Name, Title`
- Attribution-first: `Speaker Name, Title, said: "Quote"`
- According-to: `"Quote" according to Speaker Name`

**Quality Checks:**
- Length (too short < 15 chars, too long > 300 chars)
- Jargon (synergy, leverage, disrupt, etc.)
- Passive voice density
- Overly formal language
- No contractions (sounds scripted)
- Uncertain language (maybe, perhaps)
- Negative tone

### 2. Quote Quality Analyzer (`backend/utils/quote-quality-analyzer.js`)

Performs comprehensive risk assessment for ALL speakers (candidate, officials, supporters):

**Universal Risk Patterns:**
- **Unverified claims** (-15 pts, warning): Statistics, dollar amounts, "studies show"
- **Attack language** (-20 pts, warning, CRITICAL): "corrupt", "criminal", "liar", "fraud"
- **Absolute commitments** (-5 pts, flag): "never", "always", "guarantee", "promise"
- **Legal language** (-10 pts, warning): "alleged", "purported", "aforementioned"
- **Defensive language** (-5 pts, info): "despite what critics say"
- **Sensitive topics** (-5 pts, info): abortion, guns, immigration, race
- **Ambiguous pronouns** (-5 pts, info): Multiple "they" or "it" references
- **Platitudes** (-5 pts, info): "at the end of the day"

**Communication Issues:**
- **Vagueness** (-10 pts, flag): 3+ vague terms like "something", "things", "kind of"
- **Run-on sentences** (-15 pts, warning): Detected via:
  - Single sentence > 35 words
  - 3+ coordinating conjunctions (and, but, or)
  - 4+ clause indicators (commas, subordinators, relative pronouns)
- **Complexity** (-5 pts, info): Overall quote > 40 words
- **No action stated** (-5 pts, info): Opinion without impact

**Candidate-Specific Style Consistency:**

When analyzing candidate quotes, compares against last 20 candidate quotes on:

1. **Sentence length**: Deviation > 2x standard deviation
2. **Formality score** (0-10): Checks contractions, formal transitions, casual language
3. **Contraction rate**: Percentage of contractions vs total words
4. **First-person usage**: "I", "my", "me", "mine", "myself" frequency
5. **Exclamation marks**: Enthusiasm indicator
6. **Vocabulary complexity**: Average word length

**Style Deviation Flags:**
- Single deviation: -5 to -10 pts depending on severity
- 3+ deviations: Additional -10 pts + warning about authenticity

**Risk Levels:**
- **Critical**: Attack language or legal issues → Require legal review
- **High**: 3+ warnings → Request revised quote
- **Medium**: 1+ warning or 3+ flags → Review needed
- **Low**: Minor issues only

**Recommendations Generated:**
- Legal review for critical issues
- Fact verification for statistical claims
- Clarification requests for vague quotes
- Positive reframing for defensive language
- Style review for candidate inconsistencies

### 3. Database Schema (`backend/data/quotes-schema.sql`)

**extracted_quotes** - Stores all quotes with attribution and quality scores
```sql
- id, assignment_id, quote_text, quote_number
- speaker_name, speaker_title, speaker_role
- quality_score (0-100), quality_issues (JSON)
- needs_review, is_protected (default 1)
- was_modified, original_quote
```

**quote_modification_warnings** - Tracks edit attempts
```sql
- quote_id, warning_type, warning_severity
- original_text, attempted_change
- editor_acknowledged
```

**quote_quality_issues** - Denormalized quality problems
```sql
- quote_id, issue_type, issue_severity
- issue_message, issue_details
```

**quote_approvals** - Approval workflow
```sql
- quote_id, requested_by, requested_for
- status (pending/approved/rejected)
- feedback_notes, suggested_revision
```

## API Endpoints

### Extract Quotes
```javascript
POST /api/quotes/extract
{
  "text": "Full press release text...",
  "candidateName": "John Smith",
  "assignmentId": "A-2024-001"
}

Response:
{
  "success": true,
  "quotes": [
    {
      "quote_text": "...",
      "speaker_name": "John Smith",
      "speaker_title": "State Senator",
      "speaker_role": "candidate",
      "quote_number": 1,
      "quality_score": 85,
      "risk_level": "low",
      "flags": [
        {
          "type": "run_on_sentence",
          "severity": "warning",
          "message": "Quote contains run-on sentence...",
          "details": "Sentence 1: 42 words (over 35)"
        }
      ],
      "recommendations": [...]
    }
  ],
  "count": 3,
  "fields": {
    "quote_1": "...",
    "quote_1_speaker": "John Smith",
    "quote_1_title": "State Senator"
  },
  "ldJSON": [...]
}
```

### Analyze Single Quote
```javascript
POST /api/quotes/analyze
{
  "quoteText": "Quote to analyze...",
  "context": {
    "speakerRole": "candidate",
    "candidateName": "John Smith"
  }
}

Response:
{
  "success": true,
  "analysis": {
    "quote": "...",
    "baseQualityScore": 85,
    "riskLevel": "low",
    "flags": [...],
    "recommendations": [...]
  }
}
```

### Save Quotes
```javascript
POST /api/quotes/save
{
  "assignmentId": "A-2024-001",
  "quotes": [...]
}
```

### Get Quotes for Assignment
```javascript
GET /api/quotes/assignment/:assignmentId
```

### Record Modification Warning
```javascript
POST /api/quotes/warn
{
  "quoteId": 123,
  "warningType": "edit-attempt",
  "originalText": "...",
  "attemptedChange": "...",
  "editorUser": "editor@campaign.com"
}
```

### Get Quotes Needing Review
```javascript
GET /api/quotes/needs-review?limit=50&assignmentId=A-2024-001
```

## Integration with Parser

```javascript
// During press release parsing
const response = await fetch('/api/quotes/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: pressReleaseText,
    candidateName: 'John Smith',
    assignmentId: currentAssignment.id
  })
});

const { quotes, fields, ldJSON } = await response.json();

// Use extracted fields
fields.quote_1 // "First quote text"
fields.quote_1_speaker // "John Smith"
fields.quote_1_title // "State Senator"

// Save quotes to database
await fetch('/api/quotes/save', {
  method: 'POST',
  body: JSON.stringify({
    assignmentId: currentAssignment.id,
    quotes: quotes
  })
});

// Add LD-JSON to page
document.head.appendChild(createLDJSONScript(ldJSON));
```

## Run-On Sentence Detection

The system detects run-on sentences using multiple indicators:

**Criteria 1: Word Count**
- Single sentence > 35 words

**Criteria 2: Conjunction Density**
- 3+ coordinating conjunctions (and, but, or, nor, for, so, yet) in one sentence

**Criteria 3: Clause Complexity**
- 4+ clause indicators:
  - Commas (separate clauses)
  - Subordinating conjunctions (because, although, since, while, when, if, unless, until, before, after, though, whereas)
  - Relative pronouns (who, which, that, where)

**Example:**
```
"We need to invest in education and we need to support teachers and we must expand access to early childhood education"
→ Run-on detected: 3 coordinating conjunctions

"Education is important, but we also need healthcare, and we must address climate change, which affects everyone, while ensuring economic growth"
→ Run-on detected: 42 words + 5 clause indicators
```

## Candidate Style Consistency

For candidate quotes, the system builds a style profile from previous quotes:

**Profile Metrics:**
- Average sentence length: 18.5 words (std dev: 6.2)
- Formality score: 4.2 / 10 (informal to neutral)
- Contraction rate: 12% of words
- First-person rate: 8% of words
- Average word length: 4.8 characters
- Exclamation rate: 15% of quotes

**Current Quote Analysis:**
```
Quote: "I guarantee that we will never compromise on healthcare access for our seniors, and I promise that we'll fight for every family in this state."

Analysis:
⚠️ Style inconsistency: Quote is more formal than candidate's typical style
⚠️ Style inconsistency: Sentence length (24 words) differs from typical (18.5 words)
⚠️ Absolute commitment: Found 2 absolute statements ("guarantee", "promise")
→ Risk Level: MEDIUM
→ Quality Score: 75/100
```

## Best Practices

1. **Always Extract Quotes** - Run extraction on all press releases before editing
2. **Review High-Risk Quotes** - Quotes marked "warning" or "critical" need legal/editorial review
3. **Verify Factual Claims** - All statistics and dollar amounts must be sourced
4. **Respect Pre-Approved Quotes** - Quotes are usually pre-approved; modifications should be rare
5. **Check Candidate Consistency** - Flag quotes that don't sound like the candidate
6. **Avoid Run-On Sentences** - Break complex quotes into multiple shorter quotes
7. **Monitor Attack Language** - Strong attacks require legal review before publication

## Status

✅ **QuoteExtractor** - Complete
✅ **QuoteQualityAnalyzer** - Complete (with run-on detection + candidate style checking)
✅ **Database Schema** - Complete
✅ **API Routes** - Complete (needs database migration)
⏳ **Database Migration** - Pending (tables need to be created)
⏳ **Integration Testing** - Pending

## Next Steps

1. Run database migration to create quote tables
2. Integrate with press release parser
3. Add UI for quote review/approval workflow
4. Test candidate style consistency with real quote data
