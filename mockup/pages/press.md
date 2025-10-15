# Press Release — Infrastructure Plan

**Route**: `/news/infrastructure-plan`
**Type**: `NewsArticle` (schema.org)
**Status**: 🟡 Draft — 2 errors, 2 warnings

---

## ✅ Editor Checklist

| Status | Field | Issue |
|--------|-------|-------|
| ❌ | `description` | Missing article summary/excerpt |
| ❌ | `publisher.logo.url` | Missing campaign logo |
| ⚠️ | `image[]` | Empty array — need hero image |
| ⚠️ | `dateModified` | Not set — should track edits |
| ✅ | `headline` | Present and descriptive |
| ✅ | `datePublished` | Valid ISO 8601 timestamp |
| ✅ | `author` | Campaign organization set |

---

## 📍 Prose → JSON-LD Mapping

| Where in Prose | JSON-LD Field | Notes |
|----------------|---------------|-------|
| Press release headline | `headline` | ✅ "Emma Carter Outlines Plan for Infrastructure Investment" |
| First paragraph / lede | `description` | ❌ Missing — should be excerpt |
| Hero image | `image[0]` | ⚠️ Missing image URL |
| Publication date/time | `datePublished` | ✅ Already set |
| Last edit timestamp | `dateModified` | ⚠️ Should track when edited |
| Campaign logo (footer) | `publisher.logo.url` | ❌ Missing logo URL |
| Full article text | (implied) | Would be in full article body |

---

## 📝 Annotated JSONC

```jsonc
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": "https://emmacarterforcongress.org/news/infrastructure-plan",

  // Article metadata
  "headline": "Emma Carter Outlines Plan for Infrastructure Investment",  // ✅
  "description": "",  // ❌ MISSING: Add 1-2 sentence summary for previews
  "articleSection": "Press Releases",  // ✅

  // Visual assets
  "image": [""],  // ⚠️ EMPTY: Need hero image (1200x630px recommended)

  // Attribution
  "author": {
    "@type": "Organization",
    "name": "Emma Carter for Congress"  // ✅
  },
  "about": {
    "@type": "Person",
    "name": "Emma Carter"  // ✅
  },

  // Timestamps
  "datePublished": "2025-10-01T09:00:00-07:00",  // ✅
  "dateModified": "",  // ⚠️ MISSING: Track when last edited

  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://emmacarterforcongress.org/news/infrastructure-plan"
  },

  // Publisher info
  "publisher": {
    "@type": "Organization",
    "name": "Emma Carter for Congress",  // ✅
    "logo": {
      "@type": "ImageObject",
      "url": ""  // ❌ MISSING: Campaign logo for Google News
    }
  }
}
```

---

## 📦 Production JSON

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": "https://emmacarterforcongress.org/news/infrastructure-plan",
  "headline": "Emma Carter Outlines Plan for Infrastructure Investment",
  "description": "",
  "articleSection": "Press Releases",
  "image": [""],
  "author": { "@type": "Organization", "name": "Emma Carter for Congress" },
  "about": { "@type": "Person", "name": "Emma Carter" },
  "datePublished": "2025-10-01T09:00:00-07:00",
  "dateModified": "",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://emmacarterforcongress.org/news/infrastructure-plan" },
  "publisher": {
    "@type": "Organization",
    "name": "Emma Carter for Congress",
    "logo": { "@type": "ImageObject", "url": "" }
  }
}
```

---

## 🔍 Validation Results

### ❌ Errors (must fix)
- `description`: Empty value — Meta description for social shares and AI summaries
- `publisher.logo.url`: Empty value — Required for Google News validation

### ⚠️ Warnings (nice to fix)
- `image[]`: Empty array — Hero image improves social sharing and visibility
- `dateModified`: Empty value — Track content updates for freshness signals

**Status**: ❌ Cannot publish until 2 errors are resolved

---

## 🔧 JSON Patch Preview

```json
[
  {
    "op": "replace",
    "path": "/description",
    "value": "Emma Carter today released a comprehensive plan to invest in California's infrastructure, creating jobs while modernizing roads, bridges, and public transit."
  },
  {
    "op": "replace",
    "path": "/image/0",
    "value": "https://emmacarterforcongress.org/images/press/infrastructure-plan-hero.jpg"
  },
  {
    "op": "replace",
    "path": "/publisher/logo/url",
    "value": "https://emmacarterforcongress.org/images/logo-square.png"
  },
  {
    "op": "replace",
    "path": "/dateModified",
    "value": "2025-10-01T09:00:00-07:00"
  }
]
```

---

## 📖 Editor Notes

### Why this matters for AI:
- **Description** → Used by ChatGPT to summarize article without reading full text
- **Publisher logo** → Required for Google News, increases trust signals
- **Hero image** → Shows in social previews and AI-generated summaries
- **dateModified** → Signals content freshness to search engines and AI

### Next steps:
1. Write 1-2 sentence description from lede
2. Export campaign logo (square, 600x600px min)
3. Add hero image if available
4. Set dateModified to datePublished initially

---

**Last updated**: 2025-10-14
