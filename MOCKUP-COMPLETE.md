# 🎉 Campaign JSON-LD Mockup System — COMPLETE!

**Date**: October 14, 2025
**Branch**: `mockup-alternate-approach`
**Status**: ✅ Ready for Review

---

## 🚀 What Was Built

A **complete editor-focused mockup system** that demonstrates how campaign content editors can review and fix JSON-LD structured data for AI optimization.

### Key Deliverables:

1. **✅ 6 Content Type Mockups**
   - Person/Bio (4 errors, 2 warnings)
   - Press Release (2 errors, 2 warnings)
   - Issues Page (1 error)
   - Event (1 error)
   - Q&A Page (1 critical error)
   - FAQ Page (2 errors)

2. **✅ HTML Viewer Interface**
   - Single-page navigation
   - Markdown rendering
   - Status badges
   - Responsive design

3. **✅ JSONC → JSON Export System**
   - Strips comments
   - Validates syntax
   - Clean production output

4. **✅ Reusable Templates**
   - Editor checklist
   - Mapping table
   - Validation box

---

## 📁 Structure Created

```
mockup/
├── index.html              # ⭐ Start here!
├── README.md               # Full documentation
├── data/
│   ├── *.jsonc            # Annotated source (6 files)
│   └── *.json             # Production export (6 files)
├── pages/
│   └── *.md               # Mockup pages (6 files)
├── templates/
│   └── *.md               # Reusable components (3 files)
└── scripts/
    └── export_json.py     # JSONC → JSON converter
```

**Total files**: 24 files across 4 directories

---

## 🎯 Mockup Features

### Each Page Includes:

1. **Header Section**
   - Route (`/about`, `/news/...`)
   - Schema type (`Person`, `NewsArticle`, etc.)
   - Status badge (🔴/🟡/✅)

2. **Editor Checklist**
   - ❌ Errors (must fix)
   - ⚠️ Warnings (nice to fix)
   - ✅ Complete fields

3. **Mapping Table**
   - Where in prose → JSON-LD field → Notes
   - Shows editors exactly where to add missing info

4. **Annotated JSONC**
   - Full schema with inline comments
   - `// ❌ MISSING: ...` guidance
   - `// ✅` for complete fields

5. **Production JSON**
   - Clean version (no comments)
   - Ready to ship

6. **Validation Results**
   - Errors listed with severity
   - Warnings with recommendations
   - Publish status

7. **JSON Patch Preview**
   - Exact operations to fix errors
   - Copy-paste ready

8. **Editor Notes**
   - Why it matters for AI
   - Next steps
   - Best practices

---

## 🧪 Seed Data — Emma Carter for Congress (CA-15)

All mockups use a fictional candidate "Emma Carter" with **deliberately incomplete** data to demonstrate:
- What errors look like
- How to identify missing fields
- What needs to be fixed before publish

### Validation Summary:

| Content Type | Errors | Warnings | Status |
|--------------|--------|----------|--------|
| Person/Bio | 4 | 2 | 🟡 Draft |
| Press Release | 2 | 2 | 🟡 Draft |
| Issues Page | 1 | 0 | 🟡 Draft |
| Event | 1 | 0 | 🟡 Draft |
| Q&A Page | 1 | 0 | 🔴 Blocked |
| FAQ Page | 2 | 0 | 🟡 Draft |

**Total**: 11 errors, 4 warnings across 6 content types

---

## 🔧 Technical Implementation

### Export Script (`export_json.py`)

```python
# Features:
- Removes // and /* */ comments
- Preserves URLs (doesn't break https://)
- Removes ⟪PLACEHOLDER⟫ markers
- Validates JSON syntax
- Reports ✅/❌ for each file
```

**Usage**:
```bash
python3 mockup/scripts/export_json.py
```

**Output**:
```
✅ event.jsonc → event.json
✅ faqpage.jsonc → faqpage.json
✅ issues.jsonc → issues.json
✅ person.jsonc → person.json
✅ press.jsonc → press.json
✅ qapage.jsonc → qapage.json
```

### HTML Viewer

- Uses `marked.js` for Markdown rendering
- Hash-based navigation (`#person`, `#press`, etc.)
- Responsive single-page app
- No build step required
- Works offline after initial load

---

## 🎨 Design Decisions

### Why Markdown Pages?

- **Human-readable** — Easy to edit and review
- **Version-controllable** — Git-friendly
- **Portable** — Can be read as-is or rendered
- **Flexible** — Can be converted to HTML, PDF, etc.

### Why JSONC for Source?

- **Editor-friendly** — Comments guide the editing process
- **Production-ready** — Clean export to valid JSON
- **Self-documenting** — Inline explanations

### Why Separate Mockup Approach?

This mockup is **complementary** to the AI Optimization Studio:

| AI Optimization Studio | JSON-LD Mockup System |
|------------------------|------------------------|
| Real-time prose analysis | Static review pages |
| CPO claim detection | Schema.org validation |
| AI completeness scoring | Field-by-field checklist |
| Before/after simulation | JSON Patch previews |
| Single content type (press) | 6 content types |

**Both are valuable** — one for live editing, one for structured review.

---

## 📖 Documentation

### User Documentation:
- `/mockup/README.md` — Full guide
- `/mockup/pages/*.md` — Interactive examples

### Developer Documentation:
- `/mockup/scripts/export_json.py` — Well-commented
- This file — Build summary

---

## 🚦 How to Use

### 1. View the Mockup

**Option A**: Direct file open
```bash
open mockup/index.html
```

**Option B**: Local server (recommended)
```bash
python3 -m http.server 8080
# Open: http://localhost:8080/mockup/
```

### 2. Explore Content Types

- Click through nav to see each content type
- Review checklists and validation results
- Study the annotated JSONC
- See what's missing and why it matters

### 3. Export Production JSON

```bash
python3 mockup/scripts/export_json.py
```

### 4. Use in Real Campaign

1. Replace Emma Carter data with real candidate
2. Fix errors identified in checklists
3. Export clean JSON
4. Add to campaign website in `<script type="application/ld+json">`

---

## 💡 Key Insights

### For Editors:

1. **Empty fields are highlighted** — ❌ clearly marked
2. **Mapping tables connect prose to schema** — Know where to add info
3. **Validation rules are explicit** — Understand what's required vs. nice-to-have
4. **JSON Patch shows exact fixes** — No guessing

### For Campaigns:

1. **FAQ and QAPage are critical** — AI systems prioritize these
2. **Empty answers block publishing** — Can't ship incomplete Q&A
3. **Images and logos matter** — Visual content required for rich results
4. **Social links improve discovery** — Add all platforms

### For Developers:

1. **JSONC is more maintainable** — Comments don't clutter production
2. **Validation can be automated** — Script catches errors before publish
3. **Schema.org is powerful** — Covers all campaign content types
4. **JSON Patch is actionable** — Direct path to fix errors

---

## 🎯 Success Metrics

The mockup successfully demonstrates:

1. ✅ **Visual clarity** — Errors are obvious
2. ✅ **Actionable guidance** — Editors know what to do
3. ✅ **Complete coverage** — All major content types
4. ✅ **Production-ready** — Export generates valid JSON
5. ✅ **Self-documenting** — Inline comments explain everything

---

## 🔄 Relationship to Other Polis Features

### AI Optimization Studio (main branch):
- Focus: Prose → CPO transformation
- UX: Split-view editor
- Scoring: AI completeness (0-100%)
- Demo: Before/after chatbot simulation

### JSON-LD Mockup (this branch):
- Focus: Schema validation and review
- UX: Page-by-page checklists
- Scoring: Error/warning counts
- Demo: Production JSON export

### Integration Opportunity:
Merge both approaches into **unified editor**:
- Left: Prose editor
- Center: CPO markup + Schema.org validation
- Right: Recommendations + AI simulation

See: `/INTEGRATED-EDITOR-VISION.md`

---

## 🚀 Next Steps

### Phase 2 (Enhancements):

1. **Interactive Editing**
   - [ ] Edit JSONC directly in browser
   - [ ] Live validation as you type
   - [ ] Save to localStorage

2. **Advanced Validation**
   - [ ] Google Rich Results Test integration
   - [ ] Real-time schema.org validation
   - [ ] Cross-reference consistency checks

3. **More Content Types**
   - [ ] Policy pages
   - [ ] About page
   - [ ] Coalition endorsements
   - [ ] Video content

### Phase 3 (Production):

1. **CMS Integration**
   - [ ] WordPress plugin
   - [ ] Webflow integration
   - [ ] Squarespace extension

2. **Collaboration Features**
   - [ ] Multi-user editing
   - [ ] Comment threads
   - [ ] Approval workflow

3. **Analytics**
   - [ ] Track completion over time
   - [ ] Most common errors
   - [ ] Campaign-wide dashboard

---

## 📊 File Inventory

### Created on `mockup-alternate-approach` branch:

**Core files**:
- `mockup/index.html` (HTML viewer)
- `mockup/README.md` (documentation)
- `mockup/scripts/export_json.py` (export tool)

**Data files** (12 total):
- `mockup/data/*.jsonc` (6 annotated sources)
- `mockup/data/*.json` (6 production exports)

**Page mockups** (6):
- `mockup/pages/person.md`
- `mockup/pages/press.md`
- `mockup/pages/issues.md`
- `mockup/pages/event.md`
- `mockup/pages/qapage.md`
- `mockup/pages/faqpage.md`

**Templates** (3):
- `mockup/templates/editor_checklist.md`
- `mockup/templates/mapping_table.md`
- `mockup/templates/validation_box.md`

**This summary**:
- `MOCKUP-COMPLETE.md` (you are here)

---

## 🎓 Learning Resources

### For understanding JSON-LD:
- [schema.org](https://schema.org) — Official vocabulary
- [Google Rich Results Test](https://search.google.com/test/rich-results) — Validation
- [JSON-LD Playground](https://json-ld.org/playground/) — Test examples

### For understanding campaign AI optimization:
- `/AI-OPTIMIZATION-STUDIO.md` — Prose → CPO guide
- `/INTEGRATED-EDITOR-VISION.md` — Future roadmap
- `/cpo_jsonschema_v1.json` — CPO schema spec

---

## 🤝 Feedback Welcome

### Questions to explore:

1. Is the checklist format intuitive for editors?
2. Are the mapping tables helpful?
3. Is the annotated JSONC overwhelming or helpful?
4. Should we add more content types?
5. How would this integrate with existing CMS?

---

## 🏆 What Makes This Special

### Innovation:

This is a **unique approach** that:
1. Shows structured data from the **editor's perspective**
2. Bridges the gap between **prose and schema**
3. Makes JSON-LD **accessible to non-technical users**
4. Provides **actionable, specific guidance**

### Practicality:

- No training required (self-explanatory)
- Works with existing content
- Immediate value (identify errors now)
- Production-ready export

### Strategic Value:

As AI becomes primary voter information source:
- Campaigns need structured data
- Editors need validation tools
- This mockup shows the path forward

---

## 🎊 Ready for Review!

The mockup system is complete and ready for:
- ✅ User testing with campaign staff
- ✅ Developer review
- ✅ Integration planning
- ✅ Stakeholder demos

### Start here:
```bash
open mockup/index.html
```

Or via server:
```bash
python3 -m http.server 8080
# Open: http://localhost:8080/mockup/
```

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**

---

**The future of campaign content is structured, and this mockup lights the way!** 🚀
