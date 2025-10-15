# AI Optimization Studio - MVP Documentation

## 🎯 Purpose

The **AI Optimization Studio** demonstrates how campaign prose is transformed into AI-chatbot-ready content through CPO (Campaign Press Ontology) markup.

## 👥 Primary User

**AI Content Optimizer** - An editor who:
1. Takes well-written campaign prose
2. Identifies claims that need evidence
3. Adds structured CPO markup
4. Ensures AI systems (ChatGPT, Google AI Overview, etc.) can extract and cite positions accurately

## 🚀 Key Features

### 1. Split-View Editor
- **Left Panel**: Editable campaign prose
- **Right Panel**: Generated CPO JSON-LD markup
- Real-time transformation from prose → structured data

### 2. AI Completeness Scoring
- **Score**: 0-100% based on evidence coverage
- **Metrics**:
  - Verifiable Claims count
  - Evidence Links count
  - Overall completeness percentage

### 3. Intelligent Recommendations
Three severity levels:
- **Critical** (Red): Missing evidence for factual claims/polling data
- **Warning** (Yellow): Position statements without links
- **Suggestion** (Green): Enhancement opportunities

### 4. AI Chatbot Simulation
Side-by-side comparison:
- **Without CPO**: AI can't verify or cite content → Generic/vague response
- **With CPO**: AI extracts structured data → Accurate, cited response

## 📊 Scoring Algorithm

```javascript
Completeness Score = (Claims with Evidence / Total Claims) × 100%

Targets:
- 80%+ = Excellent (Green)
- 50-79% = Good (Yellow)
- <50% = Needs Work (Red)
```

## 🔍 Claim Detection

The analyzer automatically detects:
- **Polling Data**: "According to recent polling..." → Requires citation
- **Factual Claims**: "Doe belittled teachers at rally" → Needs evidence URL
- **Position Statements**: "Smith pledged to fight for..." → Should link to policy page

## 💡 Recommendations Engine

### Critical Issues
- Missing evidence for polling data
- No verifiable evidence in entire document
- Unsupported factual claims about opponents

### Warnings
- Position statements without policy links
- Low completeness score (<50%)
- Missing call-to-action

### Suggestions
- Add more specific evidence
- Link to campaign website for positions
- Include dates for time-sensitive claims

## 🎨 User Experience Flow

1. **Load Example** - See demo press release
2. **Edit Content** - Modify or paste your own prose
3. **Analyze** - Click to generate CPO markup and recommendations
4. **Review Scores** - Check AI completeness percentage
5. **See Simulation** - Compare before/after AI responses
6. **Optimize** - Follow recommendations to improve

## 📝 Example Transformation

### Input (Prose):
```
"Jane Smith Responds to John Doe's Attacks on Teachers

After John Doe belittled local teachers at a rally last night,
Jane Smith condemned the rhetoric..."
```

### Output (CPO):
```json
{
  "@type": "PressRelease",
  "cpo:releaseType": "contrast",
  "cpo:subtype": "ATT.OPP.CHAR",
  "cpo:claims": [{
    "cpo:claimText": "John Doe belittled local teachers...",
    "cpo:evidence": [{
      "url": "https://news.example.com/rally-coverage"
    }]
  }]
}
```

### AI Response Impact:
- **Before**: "I don't have specific information..."
- **After**: "Jane Smith has publicly pledged... [with citation]"

## 🔧 Technical Implementation

### Files:
- `/public/ai-optimization-studio.html` - Single-page MVP interface

### Dependencies:
- None (standalone HTML/CSS/JavaScript)

### Access:
- Direct: `http://localhost:3001/ai-optimization-studio.html`
- Via CPO Portal: `http://localhost:3001/cpo-portal.html`

## 🎯 MVP Success Metrics

The MVP demonstrates:
1. ✅ **Markup Matches Prose** - Visual mapping between text and CPO structure
2. ✅ **AI Reliability** - How evidence URLs enable accurate citations
3. ✅ **Completeness Scoring** - Quantified measure of AI-readiness
4. ✅ **Before/After Impact** - Clear demonstration of optimization value
5. ✅ **Actionable Recommendations** - Editor knows exactly what to fix

## 🚀 Future Enhancements

### Phase 2:
- Real CPO parser integration (vs. mock analysis)
- Visual prose highlighting (yellow = needs evidence, green = has evidence)
- Drag-and-drop evidence URL addition
- Multiple press release examples

### Phase 3:
- Live AI API integration (actual ChatGPT queries)
- Export optimized content with embedded JSON-LD
- Batch processing for multiple releases
- Analytics dashboard (track optimization over time)

## 📚 Related Documentation

- [CPO Schema](/cpo_jsonschema_v1.json) - Full CPO specification
- [CPO Examples](/cpo_examples/) - Sample structured releases
- [CPO Portal](/public/cpo-portal.html) - Main tools dashboard

---

**Generated**: October 14, 2025
**Status**: MVP Complete ✅
**Next Steps**: Test with real campaign prose, gather user feedback

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
