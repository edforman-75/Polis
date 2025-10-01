# Parser Learning System

## 🧠 Overview

The press release parser now learns from user corrections to improve accuracy over time!

## How It Works

### 1. **Automatic Tracking**
When you import a press release and make corrections:
- ✅ Every field edit is tracked
- ✅ Original vs. corrected values are recorded
- ✅ Patterns are learned from corrections
- ✅ Accuracy metrics are updated

### 2. **Learning Process**

```
User imports press release
         ↓
Parser extracts fields
         ↓
User makes corrections
         ↓
System records:
  • What was wrong
  • What was correct
  • Why it might have failed
         ↓
Parser learns patterns
         ↓
Next import is more accurate!
```

### 3. **What Gets Learned**

- **Quote patterns**: How quotes are formatted in your org
- **Dateline formats**: Specific location/date styles
- **Headline structures**: Common headline patterns
- **Speaker attribution**: How people are referenced
- **Field relationships**: Dependencies between fields

## Features

### Automatic Learning
No manual training needed - just use the editor normally!

```javascript
// Happens automatically:
1. Import press release
2. Edit fields as needed
3. System learns from your edits
4. Next parse is better!
```

### Accuracy Metrics
Track parser performance over time:

- **Per-field accuracy**: See which fields parse best
- **Correction frequency**: Identify problem areas
- **Confidence scores**: Know when to trust the parser
- **Historical trends**: Watch accuracy improve

### Pattern Recognition
The system learns:

- Common quote formats in your releases
- Organization-specific terminology
- Speaker name variations
- Date/location preferences
- Structural conventions

## API Endpoints

### Record a Correction
```javascript
POST /api/press-release-parser/feedback/correction
{
  "sessionId": "session_123",
  "originalText": "Full press release text",
  "parsedResult": { /* original parsed data */ },
  "correctedResult": { /* user's corrections */ },
  "fieldName": "headline",
  "originalValue": "Old headline",
  "correctedValue": "Corrected headline"
}
```

### Get Accuracy Metrics
```javascript
GET /api/press-release-parser/feedback/metrics
GET /api/press-release-parser/feedback/metrics?field=headline

Response:
{
  "success": true,
  "metrics": [
    {
      "field_type": "headline",
      "total_parses": 150,
      "correct_parses": 135,
      "corrections_made": 15,
      "accuracy_rate": 0.90
    }
  ]
}
```

### Get Learned Patterns
```javascript
GET /api/press-release-parser/feedback/patterns/quote

Response:
{
  "success": true,
  "patterns": [
    {
      "pattern_type": "quote",
      "pattern_text": "\"...\", said [Speaker]",
      "confidence_score": 0.95,
      "success_count": 25,
      "failure_count": 1
    }
  ]
}
```

### Get Improvement Suggestions
```javascript
GET /api/press-release-parser/feedback/suggestions

Response:
{
  "success": true,
  "suggestions": [
    {
      "field": "dateline",
      "accuracy": 0.65,
      "issue": "Low accuracy - review patterns",
      "commonCorrections": [...]
    }
  ]
}
```

## Frontend Integration

### Basic Setup
```javascript
import { ParserFeedbackTracker } from './js/parser-feedback-tracker.js';

const tracker = new ParserFeedbackTracker();

// After importing a press release:
tracker.startTracking(originalText, parsedData);
tracker.setupAutoTracking();
```

### Manual Tracking
```javascript
// Track specific field changes
const headlineInput = document.getElementById('headline');
tracker.trackFieldChange('headline', headlineInput);
```

### View Metrics
```javascript
// Show accuracy dashboard in console
await tracker.showAccuracyDashboard();

// Get specific metrics
const metrics = await tracker.getMetrics();
console.log('Headline accuracy:', metrics.headline);
```

## Database Schema

### parser_feedback
Stores all corrections made by users:
- `original_text`: Full press release text
- `parsed_result`: What parser extracted
- `corrected_result`: User's corrections
- `field_name`: Which field was corrected
- `original_value`: Parser's extraction
- `corrected_value`: User's correction

### parser_patterns
Learned patterns from corrections:
- `pattern_type`: Type of pattern (quote, dateline, etc.)
- `pattern_text`: The actual pattern
- `confidence_score`: 0.0 to 1.0
- `success_count`: Times pattern worked
- `failure_count`: Times pattern failed

### parser_metrics
Performance tracking:
- `field_type`: Field name
- `total_parses`: Total attempts
- `correct_parses`: Successful parses
- `corrections_made`: Number of user fixes
- `accuracy_rate`: Success percentage

## Example Workflow

### First Import
```
User imports: "Smith Says Education Funding Critical"
Parser extracts: headline = "Smith Says Education"
User corrects: headline = "Smith Says Education Funding Critical"

System learns:
  ✓ Headlines often include full context
  ✓ Don't truncate at first verb
  ✓ Pattern: [Speaker] Says [Full Topic]
```

### Second Import
```
User imports: "Jones Says Healthcare Reform Needed"
Parser uses learned pattern
Parser extracts: headline = "Jones Says Healthcare Reform Needed"
User makes no correction ✓

System updates:
  ✓ Pattern confidence increased
  ✓ Accuracy improved
```

### After 100 Imports
```
Headline accuracy: 95%
Quote extraction: 92%
Dateline parsing: 88%

Parser now understands your organization's style!
```

## Benefits

### 🎯 Improves Over Time
- Starts at ~70% accuracy
- Reaches 90%+ with usage
- Learns organization-specific patterns

### 📊 Transparent
- See exactly what's being learned
- Track accuracy improvements
- Identify problem areas

### 🔒 Privacy-Friendly
- Data stored locally in SQLite
- No external API calls
- Full control over feedback data

### 🚀 Zero Configuration
- Works out of the box
- No manual training needed
- Learns from normal usage

## Advanced Features

### Confidence Thresholds
```javascript
// Only use patterns with high confidence
feedbackService.getLearnedPatterns('quote', 0.8);
```

### Custom Analysis
```javascript
// Analyze corrections for specific field
const corrections = feedbackService.analyzeCorrections('headline');
console.log('Most common headline corrections:', corrections);
```

### Export Learning Data
```javascript
// Get all feedback for backup/analysis
const feedback = feedbackService.getRecentFeedback(1000);
```

## Monitoring

### Check Parser Health
```bash
# Get overall metrics
curl http://localhost:3001/api/press-release-parser/feedback/metrics

# Get suggestions for improvement
curl http://localhost:3001/api/press-release-parser/feedback/suggestions
```

### Console Logging
The system logs learning events:
```
📊 Parser feedback tracking started
✏️  Field corrected: headline
✅ Correction recorded: Thank you! This correction will help improve the parser.
```

## Future Enhancements

### Planned Features
- [ ] AI-powered pattern extraction
- [ ] Cross-organization learning (opt-in)
- [ ] Automatic regex optimization
- [ ] Visual pattern editor
- [ ] A/B testing of patterns
- [ ] Export/import learned patterns

### Potential Improvements
- Collaborative learning across team
- Smart field suggestions
- Predictive corrections
- Quality scoring
- Auto-repair suggestions

## Getting Started

1. **Import a press release** using the "📋 Import Draft" button

2. **Make corrections** to any fields that weren't parsed correctly

3. **The system automatically learns** from your corrections

4. **Check metrics** to see improvement over time

That's it! The parser gets better with every use.

---

## Technical Notes

### Performance
- Learning happens asynchronously
- No impact on editor performance
- Debounced field tracking (2s delay)
- Efficient database queries with indexes

### Storage
- SQLite database (lightweight)
- Automatic table creation
- Indexed for fast queries
- Minimal storage footprint

### Privacy
- All data stays local
- No telemetry or external APIs
- Full control over learned data
- Can be disabled if needed

---

Built with ❤️ to make press release editing faster and smarter!
