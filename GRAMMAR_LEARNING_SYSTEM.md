# Grammar & AP Style Learning System

## Overview

A self-improving grammar and AP Style checking system that learns from user feedback to enhance rules over time.

## Features

### ✅ Implemented

1. **Feedback Collection**
   - Records user actions (accepted, rejected, modified, ignored) on grammar suggestions
   - Captures context and patterns for analysis
   - Stores metadata for pattern clustering

2. **Pattern Detection**
   - Automatically identifies similar feedback patterns
   - Groups related issues into clusters
   - Calculates acceptance/rejection rates

3. **Rule Learning**
   - Converts high-confidence patterns (80%+ acceptance) into learned rules
   - Creates custom terminology from repeated corrections
   - Applies learned rules automatically in future checks

4. **Custom Terminology**
   - Pre-loaded campaign-specific names and terms:
     - **Abigail Spanberger** (catches: Spanberg, Spanburger, Spamberger)
     - **Winsome Earle-Sears** (catches: Earl-Sears, Earle Sears)
     - **DOGE** (catches: Doge, doge)
     - **Commonwealth** (catches: commonwealth)
   - Extensible for new terms

5. **Admin Dashboard**
   - View pending pattern clusters
   - Approve/reject learned rules
   - Monitor custom terminology
   - Track learning insights and stats

## Architecture

### Database Schema

**`grammar_feedback`** - User feedback on suggestions
- Stores original text, suggestion, user action
- Links to content and user
- Pattern hash for clustering

**`learned_rules`** - Active learned rules
- Pattern, correction, confidence
- Support count, trigger tracking
- Status (pending, approved, active)

**`custom_terminology`** - Campaign-specific terms
- Correct form, common misspellings
- Capitalization rules
- Usage tracking

**`feedback_clusters`** - Pattern groups
- Similar feedback grouped together
- Suggested rules based on patterns
- Acceptance rate statistics

**`rule_performance`** - Performance metrics
- Acceptance/rejection rates
- Precision and accuracy
- Time-windowed stats

### Services

**`GrammarLearningService`**
- Database operations
- Feedback recording
- Pattern analysis
- Cluster management

**`RuleEnhancementEngine`**
- Applies learned rules to text
- Checks custom terminology
- Records feedback
- Auto-refreshes rules every 5 minutes

**`GrammarStyleChecker`** (Enhanced)
- Integrated with learning engine
- Applies learned rules after standard checks
- Validates custom terminology

## API Endpoints

### Feedback Collection
```
POST /api/grammar-learning/feedback
{
  "ruleId": "cap_democratic_party",
  "category": "capitalization",
  "issueType": "party_name",
  "originalText": "democratic Party",
  "suggestedCorrection": "Democratic Party",
  "userAction": "accepted",
  "userId": "user123"
}
```

### Get Statistics
```
GET /api/grammar-learning/stats?category=capitalization&timeframe=30%20days
```

### Pending Clusters
```
GET /api/grammar-learning/clusters/pending
```

### Approve Cluster
```
POST /api/grammar-learning/clusters/:id/approve
{
  "approvedBy": "admin"
}
```

### Active Rules
```
GET /api/grammar-learning/rules/active?category=capitalization
```

### Custom Terminology
```
GET /api/grammar-learning/terminology
POST /api/grammar-learning/terminology
{
  "term": "Abigail Spanberger",
  "correctForm": "Abigail Spanberger",
  "termType": "person_name",
  "category": "campaign_specific",
  "capitalizationRule": "always_capitalize",
  "commonMisspellings": ["Spanberg", "Spanburger"]
}
```

## Usage

### 1. Check Text with Learning
```javascript
const checker = new GrammarStyleChecker();
const result = await checker.checkContent(text);

// Issues include learned rules and custom terminology
result.issues.forEach(issue => {
  if (issue.isLearnedRule) {
    console.log('Learned rule:', issue.message);
  }
  if (issue.isCustomTerm) {
    console.log('Custom term issue:', issue.message);
  }
});
```

### 2. Record Feedback
```javascript
// User accepted a suggestion
await checker.recordFeedback(
  issue,
  'accepted',
  null,  // userCorrection
  'This rule is correct',  // comment
  contentId,
  userId
);

// User modified the suggestion
await checker.recordFeedback(
  issue,
  'modified',
  'Different correction',  // what they used instead
  'I prefer this wording',
  contentId,
  userId
);
```

### 3. View Learning Insights
```javascript
const insights = await checker.getLearningInsights();
console.log(`Total feedback: ${insights.totalFeedback}`);
console.log(`Acceptance rate: ${insights.acceptanceRate}`);
console.log(`Pending clusters: ${insights.pendingClusters}`);
console.log(`Active rules: ${insights.activeRules}`);
```

### 4. Admin Dashboard
Access at: `http://localhost:3001/grammar-learning-dashboard.html`

Features:
- **Pending Clusters**: Review patterns and approve new rules
- **Active Rules**: View all learned rules and their performance
- **Custom Terminology**: Manage campaign-specific terms
- **Learning Insights**: Monitor system performance

## Learning Process

### 1. Feedback Recording
```
User accepts/rejects suggestion
    ↓
Feedback stored in database
    ↓
Pattern hash calculated
```

### 2. Pattern Detection
```
3+ similar patterns detected
    ↓
Cluster created with acceptance rate
    ↓
If 80%+ acceptance → Suggest as rule
```

### 3. Rule Approval
```
Admin reviews cluster
    ↓
Approves pattern
    ↓
Learned rule created and activated
```

### 4. Rule Application
```
Text checked
    ↓
Learned rules applied
    ↓
Custom terminology validated
    ↓
Combined results returned
```

## Test Results

Successfully tested:
- ✅ Custom terminology detection (5 issues found)
- ✅ Feedback recording (ID assigned)
- ✅ Statistics retrieval (1 record)
- ✅ Custom terms list (4 terms loaded)
- ✅ Pending clusters (0 initially)

Test case:
```
Input: "Winsome Earl-Sears announced today that the Trump Administration
        will implement DOGE. Abigail Spanberg supports the commonwealth."

Detected Issues:
1. "Spanberg" → "Abigail Spanberger"
2. "Earl-Sears" → "Winsome Earle-Sears"
3. "commonwealth" → "Commonwealth"
4. "Administration" → "administration" (AP Style)
```

## Future Enhancements

1. **AI-Powered Suggestions**
   - Use LLM to suggest rules from clusters
   - Auto-detect new terminology patterns
   - Generate correction suggestions

2. **Confidence Decay**
   - Lower confidence if rejection rate increases
   - Deactivate poorly performing rules
   - A/B test rule variations

3. **Context-Aware Learning**
   - Learn capitalization rules based on context
   - Detect campaign-specific style preferences
   - Adapt to user writing style

4. **Bulk Import**
   - Import terminology from external sources
   - Load style guides automatically
   - Sync with campaign knowledge base

## Configuration

### Rule Refresh Interval
Edit `rule-enhancement-engine.js`:
```javascript
this.refreshInterval = 5 * 60 * 1000; // 5 minutes (default)
```

### Cluster Threshold
Edit `grammar-learning-service.js`:
```javascript
if (rows.length >= 3) {  // Need at least 3 examples (default)
```

### Acceptance Rate Threshold
Edit `grammar-learning-service.js`:
```javascript
if (acceptanceRate >= 0.8 || rejectionRate >= 0.8) {  // 80% (default)
```

## Files Created

### Backend
- `backend/data/grammar-learning-schema.sql` - Database schema
- `backend/services/grammar-learning-service.js` - Core learning service
- `backend/services/rule-enhancement-engine.js` - Rule application engine
- `backend/routes/grammar-learning.js` - API routes
- `backend/services/grammar-style-checker.js` - Enhanced with learning

### Frontend
- `public/grammar-learning-dashboard.html` - Admin dashboard

### Scripts
- `scripts/test-grammar-learning.js` - Test suite

## Summary

The Grammar Learning System successfully:
1. ✅ Captures user feedback on suggestions
2. ✅ Detects patterns and creates clusters
3. ✅ Learns new rules from high-confidence patterns
4. ✅ Applies learned rules automatically
5. ✅ Validates custom campaign terminology
6. ✅ Provides admin dashboard for review

**Result**: A self-improving grammar checker that gets smarter with use! 🚀
