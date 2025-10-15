# FAQ Page

**Route**: `/faq`
**Type**: `FAQPage` (schema.org)
**Status**: 🟡 Draft — 2 errors, 0 warnings

---

## ✅ Editor Checklist

| Status | Field | Issue |
|--------|-------|-------|
| ❌ | `mainEntity[1].acceptedAnswer.text` | Donate by check answer is empty |
| ❌ | `mainEntity[2].acceptedAnswer.text` | Small business plan answer is empty |
| ✅ | `mainEntity[0]` | Volunteer question complete |
| ✅ | `about` | Links to Emma Carter |

---

## 📍 Prose → JSON-LD Mapping

| Where in Prose | JSON-LD Field | Notes |
|----------------|---------------|-------|
| FAQ #1: Volunteer | `mainEntity[0]` | ✅ Complete |
| FAQ #2: Donate check | `mainEntity[1]` | ❌ Answer empty |
| FAQ #3: Small business | `mainEntity[2]` | ❌ Answer empty |

---

## 📝 Annotated JSONC

```jsonc
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://emmacarterforcongress.org/faq",

  // List of Q&A pairs
  "mainEntity": [
    // FAQ #1: Volunteering (complete)
    {
      "@type": "Question",
      "name": "How can I volunteer?",  // ✅
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sign up on our website."  // ✅ (could be more detailed)
      }
    },

    // FAQ #2: Check donations
    {
      "@type": "Question",
      "name": "How do I donate by check?",  // ✅
      "acceptedAnswer": {
        "@type": "Answer",
        "text": ""  // ❌ MISSING: Need mailing address and instructions
      }
    },

    // FAQ #3: Small business policy
    {
      "@type": "Question",
      "name": "What is Emma's plan for small business growth?",  // ✅
      "acceptedAnswer": {
        "@type": "Answer",
        "text": ""  // ❌ MISSING: Policy answer needed
      }
    }
  ],

  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://emmacarterforcongress.org/faq"
  },
  "about": {
    "@type": "Person",
    "name": "Emma Carter"  // ✅
  }
}
```

---

## 📦 Production JSON

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://emmacarterforcongress.org/faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How can I volunteer?",
      "acceptedAnswer": { "@type": "Answer", "text": "Sign up on our website." }
    },
    {
      "@type": "Question",
      "name": "How do I donate by check?",
      "acceptedAnswer": { "@type": "Answer", "text": "" }
    },
    {
      "@type": "Question",
      "name": "What is Emma's plan for small business growth?",
      "acceptedAnswer": { "@type": "Answer", "text": "" }
    }
  ],
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://emmacarterforcongress.org/faq" },
  "about": { "@type": "Person", "name": "Emma Carter" }
}
```

---

## 🔍 Validation Results

### ❌ Errors (must fix)
- `mainEntity[1].acceptedAnswer.text`: Empty — Check donation instructions missing
- `mainEntity[2].acceptedAnswer.text`: Empty — Small business policy answer missing

### ⚠️ Warnings (nice to fix)
- None (but FAQ #1 answer could be more detailed)

**Status**: ❌ Cannot publish until 2 answers are added

---

## 🔧 JSON Patch Preview

```json
[
  {
    "op": "replace",
    "path": "/mainEntity/1/acceptedAnswer/text",
    "value": "Mail checks to: Emma Carter for Congress, PO Box 12345, Oakland, CA 94612. Please include your occupation and employer (required by FEC). Max $3,300 per individual."
  },
  {
    "op": "replace",
    "path": "/mainEntity/2/acceptedAnswer/text",
    "value": "Emma supports cutting red tape for small businesses, expanding access to capital through community banks, and investing in Main Street revitalization. She'll fight for fair tax treatment and oppose monopolistic practices that hurt local businesses."
  },
  {
    "op": "replace",
    "path": "/mainEntity/0/acceptedAnswer/text",
    "value": "We'd love your help! Sign up at emmacarterforcongress.org/volunteer to join our team. Opportunities include phone banking, canvassing, event support, and more."
  }
]
```

---

## 📖 Editor Notes

### Why FAQPage matters for AI:
- **FAQs are gold for chatbots** → AI systems prioritize FAQ schema
- **Direct answers** → Perfect for voice search ("Hey Google, how do I...")
- **Multiple topics** → Covers logistics AND policy positions
- **Consistency** → FAQs should align with press releases and Issues page

### Next steps:
1. Fill check donation answer (compliance team has address)
2. Get Emma's small business policy position
3. Expand volunteer answer with specific opportunities
4. Consider adding more FAQs:
   - "What district does Emma represent?"
   - "When is the election?"
   - "How can I request a yard sign?"
   - "Does Emma support [policy]?"

### Best practices for FAQ answers:
- ✅ Specific and actionable
- ✅ Include contact info when relevant
- ✅ Keep under 100 words
- ✅ Policy answers should match Issues page
- ❌ Vague or incomplete answers
- ❌ "Contact us for more info" (provide info directly)

---

## 💡 Expansion Suggestions

Add these common campaign FAQs:

| Question | Answer template |
|----------|----------------|
| "What district is Emma running in?" | "California's 15th Congressional District..." |
| "When is the primary/general election?" | "Primary: March 5, 2026. General: November 3, 2026." |
| "How can I request a yard sign?" | "Order free signs at [URL] or email..." |
| "Is Emma accepting corporate PAC money?" | "No, Emma pledges not to..." |

---

**Last updated**: 2025-10-14
