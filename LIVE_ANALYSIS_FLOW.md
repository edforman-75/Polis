# Live Analysis Flow - Free-Form Editing with Real-Time Re-Analysis

## Overview

The Live Analysis Engine allows editors to **type freely** and make changes independent of suggestions, while **automatically re-analyzing** content to catch any new issues introduced by manual edits.

## How It Works

### 1. Editor Makes Manual Changes

```
Editor types in "Headline" field:
"Smith Announces Campaign at 3pm Rally"
                            ^^^
                    (not AP Style compliant)
```

### 2. Live Analysis Detects Change

- **Input event** fired
- **Debounced** (waits 500ms for user to stop typing)
- **Analysis triggered** automatically

### 3. Content Re-Analyzed

```
API Call: POST /api/editor/analyze-field
{
  "field": "headline",
  "content": "Smith Announces Campaign at 3pm Rally",
  "settings": { ... }
}
```

### 4. New Issues Detected

```
Response:
{
  "suggestions": [
    {
      "id": "ap-style-time-001",
      "field": "headline",
      "category": "ap-style",
      "severity": "error",
      "before": "3pm",
      "after": "3 p.m.",
      "reason": "AP Style requires periods in time abbreviations",
      "confidence": 0.95
    }
  ]
}
```

### 5. UI Updates Automatically

- **Red underline** appears under "3pm"
- **Suggestions panel** updates with new AP Style error
- **Error count badge** increments: "Suggestions (1)"

### 6. Editor Can Accept or Continue Editing

**Option A: Accept Suggestion**
- Clicks **[Accept]** button
- Text updates to "3 p.m."
- Suggestion disappears
- Content re-analyzed (confirms fix worked)

**Option B: Keep Typing**
- Ignores suggestion
- Continues editing other fields
- Suggestion remains visible
- Can accept/reject later

## Detailed Event Flow

### Event: User Types

```javascript
// Field registered for live analysis
liveAnalysis.registerField(headlineElement, 'headline');

// User types "3pm"
headlineElement.addEventListener('input', (e) => {
  // 1. Capture change
  const oldValue = "Smith Announces Campaign Rally";
  const newValue = "Smith Announces Campaign at 3pm Rally";

  // 2. Schedule analysis (debounced)
  liveAnalysis.scheduleAnalysis('headline', newValue);
  // Waits 500ms...

  // 3. If user keeps typing, timer resets
  // 4. When user stops, analysis runs
});
```

### Event: Analysis Triggered

```javascript
// After 500ms of no typing
liveAnalysis.analyzeField('headline', value, { reason: 'typing' });

// Events emitted:
liveAnalysis.emitEvent('analysis-started', {
  field: 'headline',
  metadata: { reason: 'typing' }
});

// ... API call ...

liveAnalysis.emitEvent('analysis-complete', {
  field: 'headline',
  suggestions: [{ ... }]
});
```

### Event: New Error Detected

```javascript
// Check if manual edit created errors
liveAnalysis.checkForNewIssues('headline', newSuggestions);

// If errors found:
liveAnalysis.emitEvent('new-errors-detected', {
  field: 'headline',
  errors: [{ severity: 'error', ... }],
  message: 'Your edit introduced 1 new error'
});

// UI shows notification:
// ⚠️ "Your edit introduced 1 new error"
```

## Integration with Editor UI

### Setup

```javascript
import { LiveAnalysisEngine } from './js/live-analysis-engine.js';
import { SuggestionSorter } from './js/suggestion-sorter.js';

// Initialize
const liveAnalysis = new LiveAnalysisEngine(editorSettings);
const sorter = new SuggestionSorter(editorSettings);

// Register all editable fields
document.querySelectorAll('[data-editable-field]').forEach(field => {
  const fieldName = field.dataset.editableField;
  liveAnalysis.registerField(field, fieldName);
});

// Listen for analysis results
liveAnalysis.on('analysis-complete', ({ field, suggestions }) => {
  updateSuggestionsPanel(suggestions);
  updateInlineHighlights(field, suggestions);
});

liveAnalysis.on('new-errors-detected', ({ field, errors, message }) => {
  showNotification(message, 'warning');
});
```

### Updating Suggestions Panel

```javascript
function updateSuggestionsPanel(allSuggestions) {
  // Sort and group based on user preferences
  const processed = sorter.processSuggestions(allSuggestions);

  // Render in right panel
  const panel = document.getElementById('suggestions-panel');
  panel.innerHTML = renderGroupedSuggestions(processed);
}

function renderGroupedSuggestions(grouped) {
  return Object.entries(grouped).map(([groupName, suggestions]) => `
    <div class="suggestion-group">
      <h3>${groupName} (${suggestions.length})</h3>
      ${suggestions.map(s => renderSuggestionCard(s)).join('')}
    </div>
  `).join('');
}

function renderSuggestionCard(suggestion) {
  return `
    <div class="suggestion-card" data-suggestion-id="${suggestion.id}">
      <div class="suggestion-header">
        <span class="field-name">In "${suggestion.field}" field:</span>
      </div>
      <div class="suggestion-change">
        "${suggestion.before}" → "${suggestion.after}"
      </div>
      <div class="suggestion-reason">
        ${suggestion.reason}
      </div>
      <div class="suggestion-actions">
        <button onclick="acceptSuggestion('${suggestion.id}')">Accept</button>
        <button onclick="rejectSuggestion('${suggestion.id}')">Reject</button>
      </div>
    </div>
  `;
}
```

### Accepting Suggestions

```javascript
function acceptSuggestion(suggestionId) {
  // Find the suggestion
  const allSuggestions = liveAnalysis.getAllSuggestions();
  const suggestion = allSuggestions.find(s => s.id === suggestionId);

  if (!suggestion) return;

  // Get the field element
  const fieldElement = document.querySelector(`[data-editable-field="${suggestion.field}"]`);

  // Apply the suggestion
  liveAnalysis.applySuggestion(suggestion.field, suggestionId, fieldElement);

  // LiveAnalysis automatically:
  // 1. Updates field value
  // 2. Marks suggestion as accepted
  // 3. Re-analyzes field to check for new issues
  // 4. Emits 'suggestion-applied' event

  // Track the change
  trackChange({
    field: suggestion.field,
    changeType: 'suggestion-accepted',
    before: suggestion.before,
    after: suggestion.after,
    category: suggestion.category
  });
}
```

## Special Handling

### Paste Events

```javascript
// When user pastes content
liveAnalysis.on('field-pasted', ({ field, pastedText, newValue }) => {
  // Analysis happens immediately (no debounce)
  // This catches issues in pasted content quickly
  console.log(`Pasted into ${field}: ${pastedText}`);
});
```

### Blur Events

```javascript
// When user leaves a field (blur)
// Analysis happens immediately to ensure we catch everything
fieldElement.addEventListener('blur', () => {
  liveAnalysis.handleFieldBlur(fieldName, fieldElement);
  // Cancels any pending debounced analysis
  // Runs analysis immediately
});
```

### Bulk Operations

```javascript
// When applying multiple suggestions at once
function acceptAllInCategory(category) {
  // Pause live analysis to avoid multiple re-analyses
  liveAnalysis.pause();

  suggestions
    .filter(s => s.category === category)
    .forEach(s => {
      applySuggestionSilently(s);
    });

  // Resume and re-analyze all fields
  liveAnalysis.resume();
  liveAnalysis.analyzeAllFields();
}
```

## Performance Optimization

### Debouncing

- **Typing**: 500ms debounce (configurable)
- **Paste**: Immediate analysis
- **Blur**: Immediate analysis
- **Setting**: User can adjust debounce delay in settings

### Throttling API Calls

```javascript
// Only one analysis per field at a time
if (analysisInProgress.has(fieldName)) {
  queueAnalysis(fieldName); // Queue for later
  return;
}

analysisInProgress.add(fieldName);
// ... analyze ...
analysisInProgress.delete(fieldName);
```

### Caching

```javascript
// Cache recent analysis results
const analysisCache = new Map();

// Check cache before API call
const cacheKey = `${fieldName}:${hash(value)}`;
if (analysisCache.has(cacheKey)) {
  return analysisCache.get(cacheKey);
}

// Cache result
analysisCache.set(cacheKey, suggestions);
```

## User Experience

### Visual Feedback

**While Typing:**
- No interruption, smooth typing
- After 500ms pause, brief analysis indicator appears
- Suggestions update in real-time

**New Error Detected:**
```
┌───────────────────────────────────┐
│ ⚠️ Your edit introduced 1 new error│
│                                   │
│ In "headline" field:              │
│ "3pm" should be "3 p.m."         │
│                                   │
│ [Accept Fix] [Dismiss]            │
└───────────────────────────────────┘
```

**Error Fixed:**
```
┌───────────────────────────────────┐
│ ✅ Issue resolved!                 │
│ No more errors in this field.     │
└───────────────────────────────────┘
```

### Settings Control

Users can control live analysis behavior:

```javascript
// Settings in app-settings.html
{
  real_time_suggestions: true,      // Enable/disable live analysis
  debounce_delay: 500,              // How long to wait (ms)
  min_confidence_to_show: 0.5,      // Only show high-confidence suggestions
  show_suggestions_inline: true,    // Show underlines
  auto_scroll_to_suggestion: true   // Scroll to new suggestions
}
```

## Benefits

✅ **Freedom to edit**: Type whatever you want, whenever you want
✅ **Immediate feedback**: Catch issues as soon as you create them
✅ **No forced workflow**: Accept suggestions or ignore them
✅ **Smart re-analysis**: Only re-analyze what changed
✅ **Performance**: Debouncing prevents excessive API calls
✅ **Configurable**: Users control timing and thresholds

## Example Scenarios

### Scenario 1: Editor Fixes One Issue, Creates Another

```
1. Original: "Smith said he will run"
2. Editor changes: "Smith announced he will run"
   ✅ Fixed passive voice
3. Live analysis detects: "announced" is past tense, suggests "announces"
4. Editor sees new suggestion appear
5. Can accept or leave as-is
```

### Scenario 2: Editor Pastes Content from Email

```
1. Editor pastes: "Join us at our rally on 1/15/24 at 3pm"
2. Live analysis immediately detects:
   ❌ Date should be "Jan. 15, 2024"
   ❌ Time should be "3 p.m."
3. Both suggestions appear in panel
4. Editor clicks "Accept All" for AP Style category
5. Both fixed in one action
```

### Scenario 3: Editor Makes Multiple Quick Edits

```
1. Editor types "Smith" → debounce starts
2. Editor types "Smith announces" → debounce resets
3. Editor types "Smith announces campaign" → debounce resets
4. Editor stops typing → debounce expires (500ms)
5. Analysis runs once on final text
6. Result: Only one API call instead of three
```

This system ensures editors have **complete freedom** to edit while still getting **intelligent, real-time feedback** on their changes!
