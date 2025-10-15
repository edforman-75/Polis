# Campaign JSON-LD Review Mockup

This mockup demonstrates an **editor-focused review system** for campaign JSON-LD structured data.

## 🎯 Purpose

Show campaign content editors:
1. **What's missing** from each JSON-LD schema (errors/warnings)
2. **Where to fix it** in the prose (mapping table)
3. **The exact annotated JSON-LD** that will ship (with comments)
4. **Production-ready JSON** (stripped clean)

## 📁 Structure

```
mockup/
├── index.html              # HTML viewer (start here!)
├── data/                   # JSONC source files
│   ├── person.jsonc
│   ├── press.jsonc
│   ├── issues.jsonc
│   ├── event.jsonc
│   ├── qapage.jsonc
│   └── faqpage.jsonc
├── pages/                  # Markdown mockup pages
│   ├── person.md
│   ├── press.md
│   ├── issues.md
│   ├── event.md
│   ├── qapage.md
│   └── faqpage.md
├── templates/              # Reusable components
│   ├── editor_checklist.md
│   ├── mapping_table.md
│   └── validation_box.md
└── scripts/
    └── export_json.py      # JSONC → JSON converter
```

## 🚀 Quick Start

### View the Mockup

1. **Option A: Open in browser**
   ```bash
   open mockup/index.html
   ```

2. **Option B: Use a local server** (recommended for full features)
   ```bash
   cd mockup
   python3 -m http.server 8080
   # Then open: http://localhost:8080
   ```

### Export Production JSON

Run the export script to generate clean JSON from annotated JSONC:

```bash
python3 mockup/scripts/export_json.py
```

This will create `.json` files in `mockup/data/` for each `.jsonc` source.

## 📋 Content Types Covered

| Type | File | Status | Issues |
|------|------|--------|--------|
| **Person/Bio** | `person.md` | 🟡 Draft | 4 errors, 2 warnings |
| **Press Release** | `press.md` | 🟡 Draft | 2 errors, 2 warnings |
| **Issues Page** | `issues.md` | 🟡 Draft | 1 error |
| **Event** | `event.md` | 🟡 Draft | 1 error |
| **Q&A Page** | `qapage.md` | 🔴 Blocked | 1 critical error |
| **FAQ Page** | `faqpage.md` | 🟡 Draft | 2 errors |

## 🧩 Page Components

Each mockup page includes:

1. **Header** — Route, schema type, status badge
2. **Editor Checklist** — ❌/⚠️/✅ for each field
3. **Mapping Table** — "Where in prose" → "JSON-LD field" → "Notes"
4. **Annotated JSONC** — Editable with inline comments
5. **Production JSON** — Clean version (no comments)
6. **Validation Results** — Errors and warnings
7. **JSON Patch Preview** — Exact changes to apply
8. **Editor Notes** — Why it matters, next steps

## ⚙️ Technical Details

### JSONC Format

JSONC = JSON with Comments. We use it to:
- Add inline editor guidance (`// ❌ MISSING: ...`)
- Preserve comments for the editing workflow
- Strip cleanly to production JSON

### Export Script

The `export_json.py` script:
- Removes `//` line comments
- Removes `/* */` block comments
- Removes `⟪PLACEHOLDER⟫` markers
- Validates JSON syntax
- Outputs clean `.json` files

### Validation Rules

**Errors (must fix before publish):**
- Missing required fields (`name`, `headline`, `datePublished`, etc.)
- Empty URLs or `@id` values
- Blank answers in Q&A/FAQ

**Warnings (nice to fix):**
- Missing images
- Incomplete social links
- Missing CTAs

## 🎓 How to Use This Mockup

### For Editors:
1. Click through each content type in the nav
2. Review the **checklist** to see what's missing
3. Use the **mapping table** to find where in prose to add info
4. Reference the **annotated JSONC** for field names
5. Apply the **JSON Patch** to fix errors

### For Developers:
1. Edit the `.jsonc` files in `data/`
2. Run `export_json.py` to generate clean JSON
3. Copy production JSON to campaign website `<script type="application/ld+json">`
4. Validate with Google Rich Results Test

### For Campaign Staff:
1. See what content is missing for AI optimization
2. Understand why each field matters for chatbots
3. Prioritize fixes based on error severity

## 🔧 Customization

### Add a new content type:

1. Create `data/newtype.jsonc`
2. Create `pages/newtype.md` with mockup
3. Add to `index.html` nav list
4. Run `export_json.py`

### Update validation rules:

Edit the validation sections in each `.md` page.

## 📖 Related Docs

- [AI Optimization Studio](/public/ai-optimization-studio.html) — Prose → CPO transformation tool
- [CPO Schema](/cpo_jsonschema_v1.json) — Campaign Press Ontology spec
- [Integrated Editor Vision](/INTEGRATED-EDITOR-VISION.md) — Future roadmap

## 🤖 AI Optimization Context

This mockup is part of the **Polis Campaign AI Editor** project, which helps campaigns create content that AI systems (ChatGPT, Google AI Overview) can:
- Extract accurately
- Quote with confidence
- Cite with sources

The structured JSON-LD markup enables AI reliability and completeness.

---

**Built with**: Claude Code
**Candidate**: Emma Carter for Congress (CA-15) [fictional example]
**Last updated**: 2025-10-14
