# Person/Bio Page — Emma Carter

**Route**: `/about`
**Type**: `Person` (schema.org)
**Status**: 🟡 Draft — 4 errors, 2 warnings

---

## ✅ Editor Checklist

| Status | Field | Issue |
|--------|-------|-------|
| ❌ | `image` | Missing headshot image URL |
| ❌ | `memberOf.name` | Missing party affiliation |
| ❌ | `identifier[0].value` | Missing FEC ID |
| ❌ | `about.name` | Missing election/office description |
| ⚠️ | `sameAs[]` | Only has website, missing social media links |
| ⚠️ | `potentialAction[1].target.urlTemplate` | Missing volunteer signup URL |
| ✅ | `name` | Present |
| ✅ | `@id` | Valid URL |

---

## 📍 Prose → JSON-LD Mapping

| Where in Prose | JSON-LD Field | Notes |
|----------------|---------------|-------|
| Bio page headline | `name` | "Emma Carter" |
| Hero image | `image` | ❌ Missing - need 1200x1200px headshot |
| "Candidate for Congress" | `jobTitle` | Already filled |
| Party affiliation line | `memberOf.name` | ❌ Missing - should be "Democratic Party" |
| FEC disclaimer | `identifier[0].value` | ❌ Missing FEC ID |
| Footer social links | `sameAs[]` | ⚠️ Add Twitter, Facebook, Instagram |
| "About this election" section | `about.name` | ❌ Should be "U.S. House, CA-15" |
| Donate button | `potentialAction[0].target.urlTemplate` | ✅ Already linked |
| Volunteer button | `potentialAction[1].target.urlTemplate` | ⚠️ Missing URL |

---

## 📝 Annotated JSONC

```jsonc
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://emmacarterforcongress.org/about",

  // Basic candidate info
  "name": "Emma Carter",  // ✅ From bio page
  "image": "",  // ❌ MISSING: Need headshot URL (1200x1200px recommended)
  "jobTitle": "Candidate for U.S. House",  // ✅

  // Party affiliation
  "memberOf": {
    "@type": "Organization",
    "name": ""  // ❌ MISSING: Should be "Democratic Party"
  },

  // FEC compliance
  "identifier": [
    {
      "@type": "PropertyValue",
      "propertyID": "FEC",
      "value": ""  // ❌ MISSING: Need FEC ID like "C00123456"
    }
  ],

  // Links
  "sameAs": [
    "https://emmacarterforcongress.org"
    // ⚠️ INCOMPLETE: Add social media URLs
  ],

  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://emmacarterforcongress.org/about"
  },

  // Election context
  "about": {
    "@type": "Thing",
    "name": "",  // ❌ MISSING: Should be "U.S. House, CA-15"
    "startDate": "2025-11-04"  // ✅ Election day
  },

  // Call-to-action
  "potentialAction": [
    {
      "@type": "DonateAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://emmacarterforcongress.org/donate"  // ✅
      }
    },
    {
      "@type": "JoinAction",  // Volunteer signup
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": ""  // ⚠️ MISSING: Link to volunteer form
      }
    }
  ]
}
```

---

## 📦 Production JSON

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://emmacarterforcongress.org/about",
  "name": "Emma Carter",
  "image": "",
  "jobTitle": "Candidate for U.S. House",
  "memberOf": { "@type": "Organization", "name": "" },
  "identifier": [
    { "@type": "PropertyValue", "propertyID": "FEC", "value": "" }
  ],
  "sameAs": ["https://emmacarterforcongress.org"],
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://emmacarterforcongress.org/about" },
  "about": {
    "@type": "Thing",
    "name": "",
    "startDate": "2025-11-04"
  },
  "potentialAction": [
    {
      "@type": "DonateAction",
      "target": { "@type": "EntryPoint", "urlTemplate": "https://emmacarterforcongress.org/donate" }
    },
    {
      "@type": "JoinAction",
      "target": { "@type": "EntryPoint", "urlTemplate": "" }
    }
  ]
}
```

---

## 🔍 Validation Results

### ❌ Errors (must fix)
- `image`: Empty value — AI systems need headshot to show candidate
- `memberOf.name`: Empty value — Party affiliation required for political context
- `identifier[0].value`: Empty value — FEC ID required for compliance
- `about.name`: Empty value — Election/office description missing

### ⚠️ Warnings (nice to fix)
- `sameAs[]`: Only 1 link — Add social media for better discovery
- `potentialAction[1].target.urlTemplate`: Empty volunteer link — Missing engagement opportunity

**Status**: ❌ Cannot publish until 4 errors are resolved

---

## 🔧 JSON Patch Preview

Here's what needs to be applied to fix the errors:

```json
[
  {
    "op": "replace",
    "path": "/image",
    "value": "https://emmacarterforcongress.org/images/emma-headshot-1200.jpg"
  },
  {
    "op": "replace",
    "path": "/memberOf/name",
    "value": "Democratic Party"
  },
  {
    "op": "replace",
    "path": "/identifier/0/value",
    "value": "C00789456"
  },
  {
    "op": "replace",
    "path": "/about/name",
    "value": "U.S. House, CA-15"
  },
  {
    "op": "add",
    "path": "/sameAs/-",
    "value": "https://twitter.com/EmmaCarterCA15"
  },
  {
    "op": "add",
    "path": "/sameAs/-",
    "value": "https://facebook.com/EmmaCarterForCongress"
  },
  {
    "op": "replace",
    "path": "/potentialAction/1/target/urlTemplate",
    "value": "https://emmacarterforcongress.org/volunteer"
  }
]
```

---

## 📖 Editor Notes

### Why this matters for AI:
- **Headshot image** → Shows up in AI responses and Google Knowledge Panels
- **Party affiliation** → Critical context for political queries
- **FEC ID** → Validates legitimacy, prevents confusion with other candidates
- **Social links** → Increases discoverability across platforms
- **Volunteer CTA** → AI can direct supporters to action

### Next steps:
1. Get hi-res headshot (min 1200x1200px)
2. Verify FEC ID from campaign filing
3. Add social media URLs
4. Link volunteer form
5. Re-validate with export script

---

**Last updated**: 2025-10-14
**Generated by**: Polis Campaign JSON-LD Mockup System
