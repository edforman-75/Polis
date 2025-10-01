# Campaign Content Editor - Editorial Workflow

## Overview
An **editor-centric application** that transforms writer-submitted drafts into production-ready press releases through AI-assisted editing and quality enhancement.

## Core Workflow

### Input

**Two Ways to Input Writer's Draft:**

**Option A: Import Dialog (Recommended)**
```
1. Open Press Release Canvas: http://localhost:3001/press-release-canvas
2. Click "📋 Import Draft" button
3. Paste raw text from writer's submission
4. Click "Parse & Import"
```

**Option B: Direct Browser Paste**
```
1. Open Press Release Canvas: http://localhost:3001/press-release-canvas
2. Paste text directly into any field (headline, body, etc.)
3. System auto-detects and offers to parse
4. Click "Parse" to extract structured fields
```

**Writer Sources:**
- Google Drive document (copy text)
- MS Word file (copy text)
- Email submission
- Any plain text format

### Processing Steps

**1. Parse Input**
```
→ AI extracts all structured fields automatically:
  - Headline
  - Dateline (City, State, Date)
  - Contact Information
  - Lead Paragraph
  - Body Paragraphs
  - Quotes with Attribution
```

**2. Review Parsed Fields**
- Headline
- Dateline (City, State, Date)
- Contact Information (Name, Phone, Email)
- Lead Paragraph
- Body Paragraphs
- Quotes with Attribution

**3. Editorial Enhancement**
- **Voice & Tone Analysis** - Align with candidate voice
- **AP Style Checker** - Fix formatting, dates, abbreviations
- **Grammar Service** - Correct errors
- **Prose Enhancement** (⌘⇧E) - Improve weak sentences
- **Fact Verification** - Verify claims
- **Quality Scoring** - Rate 1-5

**4. Quality Validation**
```
Click "Run All Checks"
→ AP Style: ✓
→ Voice Consistency: ✓
→ Grammar: ✓
→ Facts Verified: ✓
→ Overall Quality: 4/5
```

**5. Export Production Files**
```
Click "Export" dropdown
→ Download HTML
→ Download TXT
→ Download JSON-LD
→ Download All (ZIP)
```

### Output

**Three Production-Ready Files:**

1. **HTML File** (`release-[slug]-[date].html`)
   - Fully formatted for web publishing
   - Professional styling included
   - Semantic HTML5 markup
   - Ready for CMS upload

2. **Plain Text File** (`release-[slug]-[date].txt`)
   - Standard press release format
   - FOR IMMEDIATE RELEASE header
   - Contact information block
   - ### footer
   - Ready for email distribution

3. **JSON-LD File** (`release-[slug]-[date].jsonld`)
   - Schema.org NewsArticle format
   - CPO (Campaign Press Office) extensions
   - Quality scores and metadata
   - Structured data for AI/semantic processing

## Key Features

### AI-Powered Editing
- **Parser Learning** - Improves with every correction
- **Smart Suggestions** - Context-aware recommendations
- **Auto-Enhancement** - One-click text improvement
- **Voice Matching** - Maintains candidate consistency

### Quality Assurance
- **Multi-Layer Checks** - AP Style, grammar, facts, tone
- **Confidence Scoring** - Per-field accuracy metrics
- **Validation Rules** - Ensure completeness
- **Performance Tracking** - Editor efficiency metrics

### Production Output
- **Multi-Format Export** - HTML, TXT, JSON-LD
- **Professional Styling** - Web-ready CSS
- **Structured Data** - Machine-readable metadata
- **Consistent Formatting** - Across all outputs

## User Roles

### Primary User: Editor
- **Goal**: Transform drafts into polished releases
- **Input**: Raw text from writers
- **Output**: Three production files
- **Tools**: AI assistance, quality checks, export

### Supporting Roles

**Research Director**
- Verify facts flagged by editor
- Maintain fact database
- Provide citations

**Communications Director**
- Final approval of releases
- Set voice parameters
- Monitor quality metrics

**System Administrator**
- Configure AI models via CPO Portal
- Monitor parser performance
- Update training data

## Technical Architecture

### Parser System
- **Regex-based extraction** for reliability
- **Learning from corrections** via SQLite
- **Smart suggestions** based on history
- **Performance metrics** tracking

### AI Services
- Voice matching
- Tone analysis
- Grammar checking
- Prose enhancement
- Fact identification
- AP Style validation

### Export Engine
- HTML generation with styling
- Plain text formatting
- JSON-LD schema generation
- ZIP bundling for batch download

## Success Metrics

**Editor Efficiency:**
- Time per draft: Target < 20 minutes
- First-pass approval rate
- Quality score improvement

**System Performance:**
- Parser accuracy by field
- Auto-fix acceptance rate
- Learning curve progression

**Output Quality:**
- Average quality score
- AP Style compliance
- Voice consistency

## Value Proposition

> "Transform any writer's draft into publication-ready releases in multiple formats—faster and with higher quality than manual editing."

**Not a writing tool.** Not a CMS. Not collaboration software.

**An intelligent editorial processing engine** that makes editors more efficient and outputs more consistent.

---

## Quick Start for Editors

1. **Open Canvas**: http://localhost:3001/press-release-canvas
2. **Click Import**: Paste writer's draft
3. **Review Fields**: Fix any parsing errors
4. **Apply AI Tools**: Enhance, check, verify
5. **Run Validation**: Ensure all quality gates pass
6. **Export Files**: Download HTML, TXT, JSON-LD
7. **Distribute**: Upload to CMS, send to contacts

**That's it.** Draft to production in under 20 minutes.
