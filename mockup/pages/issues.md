# Issues Page

**Route**: `/issues`
**Type**: `WebPage` with `ItemList` (schema.org)
**Status**: 🟡 Draft — 1 error, 0 warnings

---

## ✅ Editor Checklist

| Status | Field | Issue |
|--------|-------|-------|
| ❌ | `mainEntity.itemListElement[1].text` | Climate Action position text is empty |
| ✅ | `name` | Page title present |
| ✅ | `@id` | Valid URL |
| ✅ | `mainEntity.itemListElement[0]` | Affordable Housing complete |

---

## 📍 Prose → JSON-LD Mapping

| Where in Prose | JSON-LD Field | Notes |
|----------------|---------------|-------|
| Page title | `name` | ✅ "Issues" |
| First issue card | `mainEntity.itemListElement[0]` | ✅ Affordable Housing |
| Second issue card | `mainEntity.itemListElement[1]` | ❌ Climate Action text missing |
| Issue category tags | `about.termCode` | ✅ Using simple slugs |

---

## 📝 Annotated JSONC

```jsonc
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://emmacarterforcongress.org/issues",
  "name": "Issues",  // ✅

  // List of policy positions
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      // Issue #1: Affordable Housing
      {
        "@type": "CreativeWork",
        "name": "Affordable Housing",  // ✅
        "about": {
          "@type": "DefinedTerm",
          "termCode": "housing"  // ✅ Category tag
        },
        "text": "We must expand affordable housing options for working families."  // ✅
      },

      // Issue #2: Climate Action
      {
        "@type": "CreativeWork",
        "name": "Climate Action",  // ✅
        "about": {
          "@type": "DefinedTerm",
          "termCode": "climate"  // ✅
        },
        "text": ""  // ❌ MISSING: Need position statement text
      }
    ]
  }
}
```

---

## 📦 Production JSON

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://emmacarterforcongress.org/issues",
  "name": "Issues",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "CreativeWork",
        "name": "Affordable Housing",
        "about": { "@type": "DefinedTerm", "termCode": "housing" },
        "text": "We must expand affordable housing options for working families."
      },
      {
        "@type": "CreativeWork",
        "name": "Climate Action",
        "about": { "@type": "DefinedTerm", "termCode": "climate" },
        "text": ""
      }
    ]
  }
}
```

---

## 🔍 Validation Results

### ❌ Errors (must fix)
- `mainEntity.itemListElement[1].text`: Empty value — Climate Action position needs statement

### ⚠️ Warnings (nice to fix)
- None

**Status**: ❌ Cannot publish until 1 error is resolved

---

## 🔧 JSON Patch Preview

```json
[
  {
    "op": "replace",
    "path": "/mainEntity/itemListElement/1/text",
    "value": "We need bold climate action now to protect California's future. Emma supports the Green New Deal and will fight for clean energy jobs."
  }
]
```

---

## 📖 Editor Notes

### Why this matters for AI:
- **Issue positions** → AI systems extract these for "What does X support?" queries
- **termCode** → Helps categorize positions across candidates
- **Structured list** → Makes positions discoverable and quotable

### Next steps:
1. Write Climate Action position text (1-3 sentences)
2. Consider adding more issues (Healthcare, Education, etc.)
3. Each issue should be a separate itemListElement

### Expansion suggestion:
Add issues for: Healthcare, Education, Gun Safety, Economic Justice, Immigration

---

**Last updated**: 2025-10-14
