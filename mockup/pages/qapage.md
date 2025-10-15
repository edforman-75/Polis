# Q&A — Reproductive Rights

**Route**: `/qa/reproductive-rights`
**Type**: `QAPage` (schema.org)
**Status**: 🔴 Cannot publish — 1 critical error

---

## ✅ Editor Checklist

| Status | Field | Issue |
|--------|-------|-------|
| ❌ | `mainEntity.acceptedAnswer.text` | **CRITICAL**: Answer is completely empty |
| ✅ | `mainEntity.name` | Question present |
| ✅ | `mainEntity.text` | Context provided |
| ✅ | `about` | Links to Emma Carter |

---

## 📍 Prose → JSON-LD Mapping

| Where in Prose | JSON-LD Field | Notes |
|----------------|---------------|-------|
| Question headline | `mainEntity.name` | ✅ "Where do you stand on reproductive rights?" |
| Question context | `mainEntity.text` | ✅ Voter background |
| Answer text | `mainEntity.acceptedAnswer.text` | ❌ **EMPTY** — blocking publish |
| Answer author | `mainEntity.acceptedAnswer.author` | ✅ Emma Carter |

---

## 📝 Annotated JSONC

```jsonc
{
  "@context": "https://schema.org",
  "@type": "QAPage",
  "@id": "https://emmacarterforcongress.org/qa/reproductive-rights",

  // Q&A pair
  "mainEntity": {
    "@type": "Question",
    "name": "Where do you stand on reproductive rights?",  // ✅
    "text": "Voters have asked how Emma Carter would protect reproductive freedom.",  // ✅
    "author": {
      "@type": "Person",
      "name": "Emma Carter"  // ✅ (can be candidate or voter)
    },

    // Answer
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "",  // ❌ CRITICAL: Answer is completely empty!
      "author": {
        "@type": "Person",
        "name": "Emma Carter"  // ✅
      }
    }
  },

  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://emmacarterforcongress.org/qa/reproductive-rights"
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
  "@type": "QAPage",
  "@id": "https://emmacarterforcongress.org/qa/reproductive-rights",
  "mainEntity": {
    "@type": "Question",
    "name": "Where do you stand on reproductive rights?",
    "text": "Voters have asked how Emma Carter would protect reproductive freedom.",
    "author": { "@type": "Person", "name": "Emma Carter" },
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "",
      "author": { "@type": "Person", "name": "Emma Carter" }
    }
  },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://emmacarterforcongress.org/qa/reproductive-rights" },
  "about": { "@type": "Person", "name": "Emma Carter" }
}
```

---

## 🔍 Validation Results

### ❌ Errors (must fix)
- `mainEntity.acceptedAnswer.text`: **CRITICAL** — Empty answer! This is the entire purpose of a QAPage. AI systems will ignore this page without an answer.

### ⚠️ Warnings (nice to fix)
- None

**Status**: 🔴 **BLOCKED** — Cannot publish QAPage without answer text

---

## 🔧 JSON Patch Preview

```json
[
  {
    "op": "replace",
    "path": "/mainEntity/acceptedAnswer/text",
    "value": "I will always fight to protect reproductive freedom. Every person deserves the right to make their own healthcare decisions without government interference. In Congress, I will work to codify Roe v. Wade protections into federal law and ensure access to comprehensive reproductive healthcare for all."
  }
]
```

---

## 📖 Editor Notes

### Why this matters for AI:
- **QAPage is THE most important format for chatbots** → Trains AI on exact candidate positions
- **Direct question/answer pairs** → Optimized for voice search and ChatGPT
- **Empty answer = wasted opportunity** → AI will skip this entirely

### Next steps:
1. **URGENT**: Get Emma's position statement on reproductive rights
2. Keep answer focused (2-4 sentences)
3. Include specific policy commitments
4. Use first person ("I will...")

### Best practices for QAPage answers:
- ✅ Direct: "I support X"
- ✅ Specific: Mention bills, policies
- ✅ Personal: Use first person
- ❌ Vague: "It's important to..."
- ❌ Too long: Keep under 200 words

---

## 🚨 REMINDER

This QAPage **cannot go live** with an empty answer. It's like publishing a FAQ with no answers — worse than not having the page at all.

---

**Last updated**: 2025-10-14
